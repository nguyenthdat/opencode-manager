# conc-rwmutex-read-heavy

> Use `sync.RWMutex` when reads vastly outnumber writes

## Why It Matters

A plain `sync.Mutex` serializes every access, readers included. `sync.RWMutex` lets any number of readers hold the lock concurrently via `RLock`/`RUnlock`, only blocking when a writer needs exclusive access via `Lock`/`Unlock`. For read-heavy workloads (config lookups, in-memory caches, routing tables), this meaningfully reduces contention versus a plain mutex.

## Bad

```go
type Config struct {
	mu     sync.Mutex
	values map[string]string
}

func (c *Config) Get(key string) string {
	c.mu.Lock() // full mutual exclusion even though this is a pure read
	defer c.mu.Unlock()
	return c.values[key]
}

func (c *Config) Set(key, val string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.values[key] = val
}
```

## Good

```go
type Config struct {
	mu     sync.RWMutex
	values map[string]string
}

func (c *Config) Get(key string) string {
	c.mu.RLock() // many concurrent readers can proceed together
	defer c.mu.RUnlock()
	return c.values[key]
}

func (c *Config) Set(key, val string) {
	c.mu.Lock() // writers still get exclusive access
	defer c.mu.Unlock()
	c.values[key] = val
}
```

## When Not to Use RWMutex

`RWMutex` has more overhead per lock/unlock than a plain `Mutex`. Under heavy write contention, or when critical sections are extremely short, that overhead can outweigh the benefit of concurrent reads. Benchmark before assuming `RWMutex` wins - only reach for it once profiling shows real read contention on a `Mutex`-protected section, with reads clearly outnumbering writes.

```go
// Rule of thumb: start with sync.Mutex. Switch to sync.RWMutex only after
// benchmarks show contention from concurrent readers blocking each other.
```

## See Also

- [conc-mutex-minimal-scope](conc-mutex-minimal-scope.md) - Keeping any lock's critical section small
- [conc-atomic-counters](conc-atomic-counters.md) - A lighter-weight alternative for simple values
- [conc-once-init](conc-once-init.md) - A related primitive for one-time initialization instead of ongoing locking
