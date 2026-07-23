# anti-interface-pollution

> Don't accept or return interfaces broader than what the function actually uses

## Why It Matters

An interface parameter or return type that's wider than necessary - accepting a large, multi-purpose interface when only one method is called, or returning a broad interface that hides a caller's ability to access the concrete type's extra functionality - weakens type safety and discoverability without buying any real flexibility. It's the interface-design analogue of over-broad function signatures: harder to mock, harder to reason about, and harder to know what's actually being depended on.

## Bad

```go
type Store interface { // wide interface: Get, Set, Delete, List, Backup, Restore, Close
	Get(key string) (string, error)
	Set(key, value string) error
	Delete(key string) error
	List() ([]string, error)
	Backup(w io.Writer) error
	Restore(r io.Reader) error
	Close() error
}

func Lookup(s Store, key string) (string, error) { // only ever calls Get, but depends on all seven methods
	return s.Get(key)
}

func NewCache() io.Closer { // returns a broad-but-wrong-shaped interface, hiding Get/Set entirely from callers
	return &memCache{}
}
```

## Good

```go
type Getter interface { // exactly what Lookup needs, nothing more
	Get(key string) (string, error)
}

func Lookup(g Getter, key string) (string, error) {
	return g.Get(key)
}

func NewCache() *MemCache { // returns the concrete type: callers see its full, real API
	return &MemCache{}
}
```

## The Pattern Extends to Return Types Too

```go
// Returning a narrow interface HIDES capability from the caller for no reason,
// forcing an unnecessary type assertion to get at anything beyond the interface:
func NewLogger() io.Writer {
	return &FileLogger{}
}
logger := NewLogger()
fl, ok := logger.(*FileLogger) // awkward: why hide this in the first place?

// Returning the concrete type gives the caller everything, with zero downside:
func NewLogger() *FileLogger {
	return &FileLogger{}
}
```

## Rule of Thumb

Size an accepted interface to exactly the methods the function body calls (see `api-small-interfaces`), and return concrete types unless the function's entire purpose is to abstract over multiple implementations of a well-established, intentionally narrow interface (`io.Writer`, `io.Reader`).

## See Also

- [api-small-interfaces](api-small-interfaces.md) - Sizing an interface to exactly what's needed
- [api-accept-interfaces-return-structs](api-accept-interfaces-return-structs.md) - The general principle this anti-pattern violates
- [anti-premature-interface](anti-premature-interface.md) - A related anti-pattern: defining an interface before it's genuinely needed at all
