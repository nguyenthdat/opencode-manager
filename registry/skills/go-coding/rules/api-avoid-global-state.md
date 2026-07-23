# api-avoid-global-state

> Avoid package-level mutable state in libraries; make dependencies explicit

## Why It Matters

Package-level mutable variables are implicit, shared, hard-to-test global state - every caller of the package is coupled to the same instance, tests can't run in parallel without interfering with each other, and there's no way to have two independently-configured instances in the same process. Passing dependencies explicitly (via constructors and struct fields) avoids all of this.

## Bad

```go
package cache

var store = map[string]string{} // shared across every caller in the process, forever
var mu sync.Mutex

func Set(key, value string) {
	mu.Lock()
	defer mu.Unlock()
	store[key] = value
}

func Get(key string) string {
	mu.Lock()
	defer mu.Unlock()
	return store[key]
}

// Tests can't isolate state between cases, and two independent components
// in the same program can't have separate caches.
```

## Good

```go
package cache

type Cache struct {
	mu    sync.Mutex
	store map[string]string
}

func New() *Cache {
	return &Cache{store: map[string]string{}}
}

func (c *Cache) Set(key, value string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.store[key] = value
}

func (c *Cache) Get(key string) string {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.store[key]
}

// Each caller owns an independent instance:
userCache := cache.New()
sessionCache := cache.New()
```

## Where Package-Level State Is Acceptable

```go
// Truly immutable, initialized-once values are fine as package-level vars:
var ErrNotFound = errors.New("not found") // immutable sentinel error
var validNamePattern = regexp.MustCompile(`^[a-z][a-z0-9_]*$`) // compiled once, read-only after init

// A single well-documented default instance for convenience, alongside a
// constructor for callers who need isolation, is a reasonable middle ground
// (this is how net/http's DefaultClient/DefaultServeMux work):
var DefaultClient = &Client{Timeout: 30 * time.Second}
```

## Rule of Thumb

If a package-level variable is ever written to after `init()` completes, it's mutable state and should almost always become a field on a constructed type instead. Read-only values set once (sentinels, compiled regexes, parsed constants) are fine.

## See Also

- [conc-once-init](conc-once-init.md) - Safely initializing shared state exactly once, when a singleton is genuinely warranted
- [anti-package-level-mutable-state](anti-package-level-mutable-state.md) - The anti-pattern this rule prevents
- [api-constructor-new-prefix](api-constructor-new-prefix.md) - The constructor pattern that replaces implicit global state
