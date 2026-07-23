# conc-once-init

> Use `sync.Once` for one-time, thread-safe initialization

## Why It Matters

Lazily initializing a shared resource (a client, a parsed config, a connection pool) from multiple goroutines without synchronization is a data race, and naive locking around a `if initialized` check has a race window between the check and the write. `sync.Once` guarantees the initialization function runs exactly once, and every caller - even ones that arrive concurrently - blocks until it completes.

## Bad

```go
var (
	client     *http.Client
	initialized bool
)

func getClient() *http.Client {
	if !initialized { // race: two goroutines can both see false
		client = &http.Client{Timeout: 10 * time.Second}
		initialized = true // race: concurrent writes, and other goroutines may see a torn read
	}
	return client
}
```

## Good

```go
var (
	client     *http.Client
	clientOnce sync.Once
)

func getClient() *http.Client {
	clientOnce.Do(func() {
		client = &http.Client{Timeout: 10 * time.Second}
	})
	return client
}
```

## Encapsulated in a Type

```go
type LazyConfig struct {
	once sync.Once
	cfg  *Config
	err  error
}

func (l *LazyConfig) Get() (*Config, error) {
	l.once.Do(func() {
		l.cfg, l.err = loadConfig("app.json")
	})
	return l.cfg, l.err
}
```

## Rules

- `sync.Once` is for exactly-once execution, not for "run again if it failed" retry semantics - if `Do`'s function panics or the cached error matters, handle that explicitly (as in `LazyConfig` above, which caches `err` too).
- Never copy a `sync.Once` after first use; embed it by value in a struct and always access it through a pointer receiver or shared instance.
- For package-level singletons, prefer initializing directly in a `var` declaration when the value has no error path; reach for `sync.Once` only when initialization is expensive or fallible.

## See Also

- [conc-atomic-counters](conc-atomic-counters.md) - Lighter-weight primitive for simple shared counters/flags
- [conc-mutex-minimal-scope](conc-mutex-minimal-scope.md) - General mutex discipline this rule sidesteps for init
- [anti-package-level-mutable-state](anti-package-level-mutable-state.md) - Related caution around package-level state in general
