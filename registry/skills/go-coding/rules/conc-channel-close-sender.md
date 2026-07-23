# conc-channel-close-sender

> Only the sender closes a channel; a receiver never closes it

## Why It Matters

Closing a channel signals "no more values will be sent." If a receiver closes it, or if a channel with multiple senders is closed by any one of them, a subsequent send on the closed channel panics ("send on closed channel"). The rule that keeps this safe: only the single owner/sender may close, and only once all sends are guaranteed to be finished.

## Bad

```go
func consume(ch chan int) {
	for v := range ch {
		fmt.Println(v)
	}
	close(ch) // receiver closing - if the sender then sends again, it panics
}

func fanIn(a, b <-chan int, out chan int) {
	go func() {
		for v := range a {
			out <- v
		}
		close(out) // BUG: two goroutines (for a and for b) both try to close out
	}()
	go func() {
		for v := range b {
			out <- v
		}
		close(out) // panics: close of closed channel
	}()
}
```

## Good

```go
func produce(ctx context.Context, n int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out) // the single sender closes when it's done
		for i := 0; i < n; i++ {
			select {
			case out <- i:
			case <-ctx.Done():
				return
			}
		}
	}()
	return out
}

func fanIn(a, b <-chan int) <-chan int {
	out := make(chan int)
	var wg sync.WaitGroup
	wg.Add(2)
	merge := func(c <-chan int) {
		defer wg.Done()
		for v := range c {
			out <- v
		}
	}
	go merge(a)
	go merge(b)
	go func() {
		wg.Wait() // close only after BOTH producers are done
		close(out)
	}()
	return out
}
```

## Rules

- With a single producer goroutine, that goroutine closes the channel with `defer close(ch)`.
- With multiple producers writing to the same channel, use a `sync.WaitGroup` to close it only once all producers finish - never let each producer close it independently.
- Never close a channel from the receiving side, and never close a channel more than once (both panic).
- Sending on, but not closing, a channel is always safe for multiple senders; closing is the operation that must happen exactly once.

## See Also

- [conc-channel-directional](conc-channel-directional.md) - Declaring which side owns which operation
- [conc-pipeline-pattern](conc-pipeline-pattern.md) - Fan-in/fan-out patterns that rely on this rule
- [anti-goroutine-leak](anti-goroutine-leak.md) - A receiver ranging forever over a channel that's never closed
