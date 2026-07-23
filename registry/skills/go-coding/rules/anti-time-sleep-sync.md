# anti-time-sleep-sync

> Don't use `time.Sleep` as a substitute for real synchronization

## Why It Matters

`time.Sleep(d)` waits for a fixed duration regardless of whether the condition you actually care about ("has this goroutine finished," "has this value been written") has occurred - it's a guess about timing, not a guarantee. Under different load, hardware, or CI runner speed, the same sleep duration can be too short (a flaky failure) or unnecessarily long (a slower-than-necessary program), and the failure mode is exactly the kind of intermittent, hard-to-reproduce bug that erodes trust in a test suite or a production retry mechanism.

## Bad

```go
func startWorker() {
	go worker.Run()
	time.Sleep(2 * time.Second) // guessing that 2 seconds is "long enough" for worker to be ready
	client.SendRequest()          // fails intermittently if worker.Run() takes longer to initialize under load
}

func waitForFileWrite(path string) []byte {
	time.Sleep(500 * time.Millisecond) // guessing the writer finished by now
	data, _ := os.ReadFile(path)
	return data
}
```

## Good

```go
func startWorker(ready chan<- struct{}) {
	go func() {
		worker.Init()
		close(ready) // explicit signal: worker is genuinely ready, not just "probably ready by now"
		worker.Run()
	}()
}

func main() {
	ready := make(chan struct{})
	startWorker(ready)
	<-ready // waits exactly as long as needed, no more, no less
	client.SendRequest()
}
```

```go
func waitForFileWrite(ctx context.Context, path string, done <-chan struct{}) ([]byte, error) {
	select {
	case <-done: // the writer signals completion explicitly, instead of being guessed at
		return os.ReadFile(path)
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}
```

## Where a Bounded Sleep Genuinely Belongs

```go
// Backoff between retry attempts against an external system IS a legitimate
// use of a sleep-like delay - the goal here really is "wait some time," not
// "wait for a specific event" that could be signaled instead:
for attempt := 0; attempt < maxAttempts; attempt++ {
	if err := call(); err == nil {
		return nil
	}
	time.Sleep(backoff(attempt)) // legitimate: there's no event to wait on, only elapsed time
}
```

The anti-pattern is specifically using a sleep to *approximate* waiting for an event that could instead be signaled directly via a channel, `sync.WaitGroup`, or similar - not the use of delays for their own sake (rate limiting, backoff).

## See Also

- [test-avoid-sleep](test-avoid-sleep.md) - This same anti-pattern specifically in the context of tests
- [conc-waitgroup-usage](conc-waitgroup-usage.md) - The deterministic synchronization primitive that replaces a guessed sleep
- [conc-select-timeout](conc-select-timeout.md) - Combining a real signal with an upper-bound timeout, as shown above
