# mem-assert-type-size

> Add a compile-time assertion to catch accidental struct size regressions

## Why It Matters

A hot-path struct's size can silently grow when someone adds a field or reorders one carelessly, quietly undoing a deliberate alignment optimization and increasing memory/cache pressure across every slice or map holding millions of instances. A compile-time assertion turns that regression into a build failure instead of a slow, unnoticed drift.

## Bad

```go
type Event struct {
	Timestamp int64
	Count     int32
	Active    bool
	Flag      bool
}
// No assertion - a future edit can silently grow this from 16 to 24+ bytes
// and nobody notices until a profiler run months later.
```

## Good

```go
type Event struct {
	Timestamp int64
	Count     int32
	Active    bool
	Flag      bool
}

// Compile-time assertion: fails to build if Event's size ever changes
// unexpectedly. unsafe.Sizeof is evaluated at compile time for constant expressions.
const _ = uint(unsafe.Sizeof(Event{})) - 16
// unsafe.Sizeof(Event{}) must equal 16, or subtraction underflow makes this a
// negative untyped constant, which fails to compile as a uint.
```

## A Clearer, More Maintainable Form

```go
func init() {
	const wantSize = 16
	if sz := unsafe.Sizeof(Event{}); sz != wantSize {
		panic(fmt.Sprintf("Event size changed: got %d, want %d - update alignment or this assertion", sz, wantSize))
	}
}
```

The `init()` form gives a clear runtime panic message during tests/startup; the `const _` form fails at compile time but with a less readable error. Pick the `init()` form for application code where a clear message matters, and the `const` form for library code where you want a hard compile-time gate with zero runtime cost.

## When to Bother

Only add this for structs that are genuinely hot - stored in bulk, on a request path, or in a size-sensitive protocol encoding. It's noise on ordinary application structs.

## See Also

- [mem-struct-field-alignment](mem-struct-field-alignment.md) - The optimization this assertion protects
- [test-benchmark-b-loop](test-benchmark-b-loop.md) - Benchmarks that would otherwise be the only signal of a regression
- [mem-benchmark-alloc](mem-benchmark-alloc.md) - Complementary allocation-count tracking
