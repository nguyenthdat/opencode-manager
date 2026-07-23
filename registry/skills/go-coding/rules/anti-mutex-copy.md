# anti-mutex-copy

> Never copy a struct that contains a `sync.Mutex` (or `WaitGroup`, `RWMutex`, etc.)

## Why It Matters

`sync.Mutex` and similar synchronization primitives must not be copied after first use - a copy has its own independent internal lock state, disconnected from the original, so two copies "protecting the same struct" no longer actually exclude each other, and `go vet`'s `copylocks` check exists specifically because this bug produces no compile error and often no visible symptom until a rare race occurs.

## Bad

```go
type Counter struct {
	mu    sync.Mutex
	count int
}

func (c Counter) Inc() { // value receiver: copies the ENTIRE Counter, including its mutex, on every call
	c.mu.Lock()
	defer c.mu.Unlock()
	c.count++ // increments the COPY's count - the original Counter never actually changes
}

func processAll(counters []Counter) {
	for _, c := range counters { // range also copies each Counter by value
		c.Inc() // operates on a temporary copy, entirely disconnected from the original
	}
}
```

## Good

```go
type Counter struct {
	mu    sync.Mutex
	count int
}

func (c *Counter) Inc() { // pointer receiver: no copy, mutates and locks the real instance
	c.mu.Lock()
	defer c.mu.Unlock()
	c.count++
}

func processAll(counters []*Counter) { // slice of pointers, not values, when the type holds a mutex
	for _, c := range counters {
		c.Inc()
	}
}
```

## `go vet` Catches This

```sh
go vet ./...
# main.go:10:17: Inc passes lock by value: Counter contains sync.Mutex
```

`go vet`'s `copylocks` check flags any function, assignment, or channel operation that copies a type containing (directly or via an embedded/nested field) a `sync.Mutex`, `sync.RWMutex`, `sync.WaitGroup`, or similar.

## The Rule, Generalized

Any type embedding a lock, wait group, or similar stateful synchronization primitive must always be used via a pointer from the moment it's constructed onward - never returned, passed, or ranged over by value.

## See Also

- [conc-mutex-minimal-scope](conc-mutex-minimal-scope.md) - Correct mutex usage this anti-pattern silently breaks
- [conc-waitgroup-usage](conc-waitgroup-usage.md) - `sync.WaitGroup` is subject to the exact same copy restriction
- [lint-govet-enabled](lint-govet-enabled.md) - The `copylocks` vet check that catches this automatically
