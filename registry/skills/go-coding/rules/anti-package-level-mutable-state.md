# anti-package-level-mutable-state

> Don't rely on package-level mutable variables shared across all callers

## Why It Matters

A package-level variable that's written to after initialization is implicit, global, shared state - every caller anywhere in the process sees the same instance, tests can't isolate their own state, and two independent components in the same program can never have separately-configured instances. It also frequently hides a genuine concurrency bug, since access to it is easy to leave unsynchronized.

## Bad

```go
package ratelimit

var (
	requestCounts = map[string]int{} // shared, mutable, and NOT synchronized
	mu            sync.Mutex          // present, but easy to forget to use consistently
)

func Allow(key string) bool {
	mu.Lock()
	defer mu.Unlock()
	requestCounts[key]++
	return requestCounts[key] <= 100
}

func Reset() {
	requestCounts = map[string]int{} // resets EVERY caller's state everywhere in the process at once
}
```

```go
func TestAllow(t *testing.T) {
	ratelimit.Reset() // tests can't run in parallel - they'd stomp on each other's shared state
	// ...
}
```

## Good

```go
package ratelimit

type Limiter struct {
	mu     sync.Mutex
	counts map[string]int
	max    int
}

func NewLimiter(max int) *Limiter {
	return &Limiter{counts: map[string]int{}, max: max}
}

func (l *Limiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.counts[key]++
	return l.counts[key] <= l.max
}

func (l *Limiter) Reset() {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.counts = map[string]int{}
}
```

```go
func TestAllow(t *testing.T) {
	t.Parallel() // safe: each test constructs its own isolated Limiter
	l := ratelimit.NewLimiter(100)
	// ...
}
```

## The One Exception: Genuinely Immutable Package State

```go
var ErrLimitExceeded = errors.New("rate limit exceeded") // never mutated after init - perfectly fine
var validKeyPattern = regexp.MustCompile(`^[a-z0-9_]+$`)  // compiled once, read-only thereafter
```

## See Also

- [api-avoid-global-state](api-avoid-global-state.md) - The rule this anti-pattern violates, with more remediation depth
- [conc-once-init](conc-once-init.md) - Safe one-time initialization for the rare case a genuine singleton is warranted
- [test-parallel-t-parallel](test-parallel-t-parallel.md) - Why isolated, non-shared state is what enables parallel tests
