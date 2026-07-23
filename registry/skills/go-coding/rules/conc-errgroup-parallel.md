# conc-errgroup-parallel

> Use `golang.org/x/sync/errgroup` for parallel work that can fail

## Why It Matters

Coordinating several goroutines that can each fail - propagating the first error, cancelling the rest, and waiting for cleanup - is fiddly to hand-roll correctly with channels and `WaitGroup`. `errgroup.Group` bundles this into a few lines and integrates with `context.Context` cancellation.

## Bad

```go
func fetchAll(ctx context.Context, urls []string) ([]Result, error) {
	var wg sync.WaitGroup
	results := make([]Result, len(urls))
	var mu sync.Mutex
	var firstErr error

	for i, url := range urls {
		wg.Add(1)
		go func(i int, url string) {
			defer wg.Done()
			r, err := fetch(ctx, url)
			if err != nil {
				mu.Lock()
				if firstErr == nil {
					firstErr = err
				}
				mu.Unlock()
				return // other goroutines keep running with no cancellation
			}
			results[i] = r
		}(i, url)
	}
	wg.Wait()
	return results, firstErr
}
```

## Good

```go
import "golang.org/x/sync/errgroup"

func fetchAll(ctx context.Context, urls []string) ([]Result, error) {
	g, ctx := errgroup.WithContext(ctx)
	results := make([]Result, len(urls))

	for i, url := range urls {
		i, url := i, url // pre-1.22 capture idiom; harmless to keep for clarity
		g.Go(func() error {
			r, err := fetch(ctx, url)
			if err != nil {
				return fmt.Errorf("fetch %s: %w", url, err)
			}
			results[i] = r
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err // first error; ctx was cancelled for the others
	}
	return results, nil
}
```

## Limiting Concurrency

```go
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(10) // at most 10 goroutines in flight (Go x/sync v0.3+)
for _, url := range urls {
	url := url
	g.Go(func() error {
		return process(ctx, url)
	})
}
if err := g.Wait(); err != nil {
	return err
}
```

## When You Need Every Error, Not Just the First

`errgroup.Wait()` returns only the first non-nil error. If all failures matter, collect them yourself with a mutex-guarded slice and `errors.Join`, or use `g.SetLimit` with manual accumulation instead of relying on `errgroup`'s built-in error return.

## See Also

- [conc-waitgroup-usage](conc-waitgroup-usage.md) - The lower-level primitive `errgroup` builds on
- [err-join-multiple](err-join-multiple.md) - Collecting every error instead of just the first
- [conc-context-cancel-propagate](conc-context-cancel-propagate.md) - How `errgroup.WithContext` cancels sibling goroutines
