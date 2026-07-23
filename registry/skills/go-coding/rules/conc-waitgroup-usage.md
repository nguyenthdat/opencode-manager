# conc-waitgroup-usage

> Use `sync.WaitGroup` to wait for a known set of goroutines to finish

## Why It Matters

`sync.WaitGroup` is the standard primitive for "start N goroutines, then wait until all of them are done." Getting `Add`/`Done`/`Wait` in the wrong place is a very common source of races and panics ("negative WaitGroup counter" or a `Wait()` that returns before work is actually finished).

## Bad

```go
func processAll(items []Item) {
	var wg sync.WaitGroup
	for _, item := range items {
		go func() {
			wg.Add(1)     // race: Add may run after Wait() has already returned
			defer wg.Done()
			process(item) // BUG: item is the shared loop variable pre-Go-1.22 semantics
		}()
	}
	wg.Wait()
}
```

## Good

```go
func processAll(items []Item) {
	var wg sync.WaitGroup
	wg.Add(len(items)) // Add before spawning, for the whole batch
	for _, item := range items {
		go func(item Item) { // Go 1.22+ loop vars are per-iteration; explicit param still reads clearly
			defer wg.Done()
			process(item)
		}(item)
	}
	wg.Wait()
}
```

## Collecting Results Safely

```go
func fetchAll(urls []string) []Result {
	results := make([]Result, len(urls))
	var wg sync.WaitGroup
	wg.Add(len(urls))
	for i, url := range urls {
		go func(i int, url string) {
			defer wg.Done()
			results[i] = fetch(url) // each goroutine writes a distinct index - no data race
		}(i, url)
	}
	wg.Wait()
	return results
}
```

## Rules

- Call `Add` before starting the goroutine it counts, never inside it.
- Always pair `Add` with a `defer wg.Done()` as the very first line of the goroutine body.
- Never copy a `WaitGroup` after use; pass it by pointer if it must cross function boundaries.
- For error-producing concurrent work, prefer `errgroup.Group`, which wraps this same pattern with error propagation.

## See Also

- [conc-errgroup-parallel](conc-errgroup-parallel.md) - Adds error propagation on top of the same wait pattern
- [conc-goroutine-lifecycle](conc-goroutine-lifecycle.md) - Broader checklist for spawning goroutines safely
- [anti-mutex-copy](anti-mutex-copy.md) - The same "never copy after use" rule applies to `WaitGroup`
