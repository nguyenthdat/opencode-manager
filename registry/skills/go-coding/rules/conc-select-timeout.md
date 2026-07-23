# conc-select-timeout

> Use `select` with `ctx.Done()` or `time.After` to bound blocking operations

## Why It Matters

A bare channel receive (`v := <-ch`) blocks forever if nothing ever arrives. Wrapping it in a `select` alongside `ctx.Done()` (for caller-driven cancellation) or a timer (for a hard deadline) turns an unbounded wait into one that reliably completes, which is essential for anything that touches the network, another goroutine, or an external system.

## Bad

```go
func waitForResult(ch <-chan Result) Result {
	return <-ch // blocks forever if the producer never sends
}
```

## Good

```go
func waitForResult(ctx context.Context, ch <-chan Result) (Result, error) {
	select {
	case r := <-ch:
		return r, nil
	case <-ctx.Done():
		return Result{}, ctx.Err()
	}
}
```

## Timeout Without an Existing Context

```go
func waitWithTimeout(ch <-chan Result, d time.Duration) (Result, error) {
	timer := time.NewTimer(d)
	defer timer.Stop() // always stop the timer to release its resources promptly

	select {
	case r := <-ch:
		return r, nil
	case <-timer.C:
		return Result{}, fmt.Errorf("wait for result: %w", context.DeadlineExceeded)
	}
}
```

## Avoid `time.After` in a Loop

```go
// Bad: time.After allocates a new timer every iteration and it's never stopped
// until it fires, leaking timers if the loop exits early via another branch.
for {
	select {
	case v := <-ch:
		use(v)
	case <-time.After(time.Second): // leaks each iteration until it fires
		return
	}
}

// Good: create one timer/ticker and reuse it.
ticker := time.NewTicker(time.Second)
defer ticker.Stop()
for {
	select {
	case v := <-ch:
		use(v)
	case <-ticker.C:
		return
	}
}
```

## Default Case for Non-Blocking Operations

```go
select {
case v := <-ch:
	use(v)
default:
	// channel not ready right now; don't block
}
```

## See Also

- [conc-context-cancel-propagate](conc-context-cancel-propagate.md) - Where the `ctx` used here comes from
- [conc-channel-buffered-backpressure](conc-channel-buffered-backpressure.md) - Sizing channels used with select loops
- [http-client-timeout](http-client-timeout.md) - Applying a similar bound at the HTTP client level
