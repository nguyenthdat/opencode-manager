# api-avoid-any-overuse

> Avoid `any`/`interface{}` in APIs when a concrete or generic type would work

## Why It Matters

`any` accepts anything, which means the compiler can no longer help callers catch a mismatched type at compile time - errors show up at runtime as failed type assertions or panics instead. Every `any` parameter or return value pushes a validation and type-safety burden onto every caller that a concrete type or a generic constraint would have handled automatically.

## Bad

```go
func Process(data any) any { // callers get zero compile-time safety
	switch v := data.(type) {
	case int:
		return v * 2
	case string:
		return v + v
	default:
		panic("unsupported type") // discovered only at runtime, and only if this path is hit
	}
}

func Cache(key string, value any) { // any value, no constraint on what's storable
	cache[key] = value
}
```

## Good

```go
func Double(n int) int { // concrete type: the compiler enforces correct usage
	return n * 2
}

func Repeat(s string) string {
	return s + s
}

// Or, if genuinely generic behavior across numeric types is needed:
func Double[T int | int64 | float64](n T) T {
	return n * 2
}

func Cache[T any](key string, value T) { // still generic, but at least type-parameterized
	// implementation stores a typed value per instantiation
}
```

## When `any` Is the Right Choice

```go
// A truly generic container/serialization boundary where the type is not
// knowable ahead of time is a legitimate use of any:
func MustJSON(v any) []byte {
	b, err := json.Marshal(v)
	if err != nil {
		panic(err)
	}
	return b
}

// json.Unmarshal itself must accept any because Go's stdlib can't know your types.
```

## Rule of Thumb

Reach for `any` only at genuine type-erasure boundaries (serialization, generic containers, plugin systems) - not as a substitute for writing out the actual types your function needs, and not as a lazy way to avoid designing a proper generic constraint.

## See Also

- [gen-constraints-narrow](gen-constraints-narrow.md) - Writing a real constraint instead of falling back to `any`
- [gen-avoid-unnecessary-generics](gen-avoid-unnecessary-generics.md) - The opposite failure mode: over-genericizing
- [mem-avoid-interface-boxing](mem-avoid-interface-boxing.md) - The performance cost of `any` in hot paths
