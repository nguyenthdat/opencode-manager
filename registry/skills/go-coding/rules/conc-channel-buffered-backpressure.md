# conc-channel-buffered-backpressure

> Choose channel buffer size deliberately for backpressure and decoupling

## Why It Matters

An unbuffered channel synchronizes sender and receiver in lockstep - the send blocks until the receiver is ready. A buffered channel decouples them up to the buffer size, but pick that size arbitrarily (or make it unbounded-feeling with a huge number) and you either lose backpressure entirely or hide a slow consumer behind a growing queue that eventually exhausts memory.

## Bad

```go
// Unbounded-feeling buffer - hides a slow consumer instead of applying backpressure
jobs := make(chan Job, 1_000_000)

// No buffer at all for a case that genuinely needs decoupling -
// every producer call blocks until a consumer happens to be ready
results := make(chan Result)
```

## Good

```go
// Unbuffered: use when you want the producer to feel backpressure immediately -
// a natural rendezvous point between one producer and one consumer.
requests := make(chan Request)

// Small, deliberate buffer: absorbs brief bursts without unbounded growth,
// sized to the expected batch or worker count.
jobs := make(chan Job, 100)

func dispatch(ctx context.Context, jobs <-chan Job, workers int) {
	sem := make(chan struct{}, workers) // buffer = concurrency limit, a common idiom
	for job := range jobs {
		sem <- struct{}{}
		go func(j Job) {
			defer func() { <-sem }()
			process(j)
		}(job)
	}
}
```

## Reasoning About Buffer Size

| Buffer | Effect |
|--------|--------|
| `0` (unbuffered) | Sender blocks until a receiver is ready; strongest backpressure, simplest reasoning |
| Small, fixed (e.g., `10`-`100`) | Absorbs short bursts; still exerts backpressure once full |
| Large/"unbounded" | Defers the backpressure problem; risks unbounded memory growth under sustained overload |

Pick the number from an actual constraint (worker pool size, expected burst size), not a guess. If you can't justify the number, start unbuffered and add a buffer only after measuring a real bottleneck.

## See Also

- [conc-worker-pool-bounded](conc-worker-pool-bounded.md) - Applying backpressure via a bounded worker count
- [conc-channel-directional](conc-channel-directional.md) - Declaring the direction of the channels created here
- [anti-goroutine-per-request-unbounded](anti-goroutine-per-request-unbounded.md) - What happens without any backpressure at all
