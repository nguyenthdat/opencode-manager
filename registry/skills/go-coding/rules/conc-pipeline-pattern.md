# conc-pipeline-pattern

> Compose concurrent stages as a pipeline connected by channels

## Why It Matters

The pipeline pattern - a chain of stages, each reading from an input channel and writing to an output channel - lets you express staged, streaming concurrent processing (generate, transform, filter, sink) without a monolithic goroutine that tries to do everything at once. Each stage can be scaled, tested, and reasoned about independently.

## Bad

```go
// One goroutine doing generation, transformation, and consumption inline -
// can't scale stages independently, and cancellation has to be threaded through by hand.
func processAll(ctx context.Context, nums []int) []int {
	var out []int
	for _, n := range nums {
		squared := n * n
		if squared%2 == 0 {
			out = append(out, squared)
		}
	}
	return out
}
```

## Good

```go
func generate(ctx context.Context, nums []int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for _, n := range nums {
			select {
			case out <- n:
			case <-ctx.Done():
				return
			}
		}
	}()
	return out
}

func square(ctx context.Context, in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for n := range in {
			select {
			case out <- n * n:
			case <-ctx.Done():
				return
			}
		}
	}()
	return out
}

func filterEven(ctx context.Context, in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for n := range in {
			if n%2 != 0 {
				continue
			}
			select {
			case out <- n:
			case <-ctx.Done():
				return
			}
		}
	}()
	return out
}

func processAll(ctx context.Context, nums []int) []int {
	stage1 := generate(ctx, nums)
	stage2 := square(ctx, stage1)
	stage3 := filterEven(ctx, stage2)

	var out []int
	for n := range stage3 {
		out = append(out, n)
	}
	return out
}
```

## Rules

- Every stage owns and closes its own output channel (see `conc-channel-close-sender`).
- Every stage must select on `ctx.Done()` while sending, or a cancelled consumer downstream will leave it blocked forever.
- Fan-out (multiple goroutines reading one channel) and fan-in (merging several channels into one) compose naturally with this shape when a stage needs more throughput.

## See Also

- [conc-channel-directional](conc-channel-directional.md) - Typing each stage's channel parameters correctly
- [conc-channel-close-sender](conc-channel-close-sender.md) - Ownership rule each stage in the pipeline follows
- [conc-worker-pool-bounded](conc-worker-pool-bounded.md) - Fanning a stage out across multiple workers
