# conc-channel-directional

> Use directional channel types (`chan<-`, `<-chan`) in function signatures

## Why It Matters

A bidirectional `chan T` parameter lets a function both send and receive, even if it should only do one. Declaring the direction in the signature documents intent, and the compiler enforces it - a function that's only supposed to consume can't accidentally close or send on the channel.

## Bad

```go
func producer(ch chan int) { // could wrongly receive from ch too
	for i := 0; i < 10; i++ {
		ch <- i
	}
	close(ch)
}

func consumer(ch chan int) { // could wrongly send on ch too
	for v := range ch {
		fmt.Println(v)
	}
}
```

## Good

```go
func producer(ch chan<- int) { // send-only: compiler rejects a receive here
	defer close(ch)
	for i := 0; i < 10; i++ {
		ch <- i
	}
}

func consumer(ch <-chan int) { // receive-only: compiler rejects a send here
	for v := range ch {
		fmt.Println(v)
	}
}

func main() {
	ch := make(chan int) // bidirectional at the point of creation
	go producer(ch)
	consumer(ch) // implicitly converts to <-chan int when passed
}
```

## Directional Channels as Return Types

```go
// Returning a receive-only channel signals to callers: "you consume, you don't own closing it."
func Generate(ctx context.Context, n int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
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
```

## Rules

- Any channel parameter that's only ever sent to or only ever received from should be typed accordingly.
- A function that returns a channel it owns typically returns `<-chan T`, signaling the caller must not close it.
- Bidirectional `chan T` is appropriate at the point where the channel is created and both directions are genuinely needed.

## See Also

- [conc-channel-close-sender](conc-channel-close-sender.md) - Who is responsible for closing a channel
- [conc-channel-buffered-backpressure](conc-channel-buffered-backpressure.md) - Choosing buffer size for a channel
- [conc-pipeline-pattern](conc-pipeline-pattern.md) - Directional channels are the backbone of pipeline stages
