# conc-atomic-counters

> Use `sync/atomic` for simple counters and flags instead of a mutex

## Why It Matters

A `sync.Mutex` protecting a single integer increment is correct but heavier than necessary. `sync/atomic` (and the typed wrappers `atomic.Int64`, `atomic.Bool`, etc. added in Go 1.19) provide lock-free, race-free operations for simple values with less code and typically lower overhead under contention.

## Bad

```go
type Counter struct {
	mu    sync.Mutex
	count int64
}

func (c *Counter) Inc() {
	c.mu.Lock()
	c.count++
	c.mu.Unlock()
}

func (c *Counter) Value() int64 {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.count
}
```

## Good

```go
type Counter struct {
	count atomic.Int64 // Go 1.19+ typed atomic; no separate mutex needed
}

func (c *Counter) Inc() {
	c.count.Add(1)
}

func (c *Counter) Value() int64 {
	return c.count.Load()
}
```

## Typed Atomics Cover the Common Cases

```go
var (
	requests atomic.Int64
	ready    atomic.Bool
	current  atomic.Pointer[Config]
)

requests.Add(1)
ready.Store(true)
current.Store(&Config{Timeout: 5 * time.Second})

cfg := current.Load() // safe concurrent read of the latest pointer
```

## When a Mutex Is Still the Right Tool

Atomics only help for a single value updated independently. As soon as you need to update two or more related fields together consistently (e.g., both a total and a count that must stay in sync), use a mutex to protect the whole struct - mixing atomics and partial locking for related fields reintroduces races.

## See Also

- [conc-mutex-minimal-scope](conc-mutex-minimal-scope.md) - When a mutex is the correct choice instead
- [conc-once-init](conc-once-init.md) - Another lock-free primitive for a different use case
- [mem-struct-field-alignment](mem-struct-field-alignment.md) - Atomic fields have alignment requirements on some platforms
