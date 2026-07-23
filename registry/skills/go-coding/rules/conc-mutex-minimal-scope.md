# conc-mutex-minimal-scope

> Keep the critical section under a mutex as small as possible

## Why It Matters

Every line executed while holding a lock blocks every other goroutine that needs the same lock. Holding a mutex across I/O, expensive computation, or unrelated logic turns what should be brief, cheap synchronization into a serialization bottleneck - and increases the risk of deadlocks if that code itself tries to acquire another lock.

## Bad

```go
type Cache struct {
	mu   sync.Mutex
	data map[string]string
}

func (c *Cache) Refresh(key string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	val, err := fetchFromDB(key) // slow network call held under the lock!
	if err != nil {
		return "", err
	}
	c.data[key] = val
	return val, nil
}
```

## Good

```go
type Cache struct {
	mu   sync.Mutex
	data map[string]string
}

func (c *Cache) Refresh(key string) (string, error) {
	val, err := fetchFromDB(key) // do the slow work first, without holding the lock
	if err != nil {
		return "", err
	}

	c.mu.Lock()
	c.data[key] = val // only the map mutation is protected
	c.mu.Unlock()

	return val, nil
}
```

## Scoping the Lock to a Block

```go
func (c *Cache) Get(key string) (string, bool) {
	c.mu.Lock()
	val, ok := c.data[key]
	c.mu.Unlock()
	return val, ok
}

// Or with a closure to make the scope visually explicit for a larger function:
func (c *Cache) snapshot() map[string]string {
	c.mu.Lock()
	defer c.mu.Unlock()

	out := make(map[string]string, len(c.data))
	for k, v := range c.data {
		out[k] = v
	}
	return out
}
```

## Rules

- Never call another function that might block (I/O, another lock, a channel send) while holding a mutex, unless you've verified it can't deadlock.
- Prefer `defer mu.Unlock()` immediately after `Lock()` for correctness, but keep the *function* itself short if the critical section needs to be small - split out a helper if necessary.
- If you find yourself unlocking and relocking mid-function to keep sections small, that's a sign the function is doing too much; consider restructuring.

## See Also

- [conc-rwmutex-read-heavy](conc-rwmutex-read-heavy.md) - An alternative when reads dominate writes
- [conc-atomic-counters](conc-atomic-counters.md) - Simpler primitives for trivial shared counters
- [anti-mutex-copy](anti-mutex-copy.md) - Another common mutex mistake
