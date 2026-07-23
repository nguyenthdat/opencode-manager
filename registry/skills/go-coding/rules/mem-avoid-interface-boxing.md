# mem-avoid-interface-boxing

> Avoid unnecessary `any`/`interface{}` boxing in hot paths

## Why It Matters

Storing a non-pointer, non-interface value inside an `any` requires the runtime to box it - allocate space on the heap (in most cases) and store a pointer to it alongside type information. Doing this repeatedly in a hot loop (logging, serialization, generic containers) adds allocation pressure that a concrete type or a well-chosen generic wouldn't.

## Bad

```go
func sum(values []any) int {
	total := 0
	for _, v := range values { // each element boxed an int into an interface at append time
		total += v.(int)
	}
	return total
}

func logFields(fields map[string]any) {
	for k, v := range fields {
		fmt.Printf("%s=%v\n", k, v) // v boxed on every call site that populated the map
	}
}
```

## Good

```go
func sum(values []int) int { // concrete type: no boxing at all
	total := 0
	for _, v := range values {
		total += v
	}
	return total
}

// Or, if the API genuinely needs to be generic over numeric types:
func sumGeneric[T int | int64 | float64](values []T) T {
	var total T
	for _, v := range values {
		total += v
	}
	return total
}
```

## Structured Logging Avoids Boxing Common Cases

```go
// slog's typed attribute constructors avoid boxing simple values into `any`
// for the common types, unlike building a map[string]any by hand.
logger.Info("request handled",
	slog.String("method", r.Method),
	slog.Int("status", status),
	slog.Duration("elapsed", elapsed),
)
```

## When `any` Is the Right Tool

`any` is appropriate at genuine API boundaries where the type truly isn't known ahead of time (a generic JSON decoder, a plugin interface). The rule is about avoiding *incidental* boxing in code that could just as easily use a concrete or generic type - not eliminating `any` everywhere.

## See Also

- [gen-avoid-unnecessary-generics](gen-avoid-unnecessary-generics.md) - The flip side: don't over-generify either
- [api-avoid-any-overuse](api-avoid-any-overuse.md) - The API-design angle on the same issue
- [mem-benchmark-alloc](mem-benchmark-alloc.md) - Measuring whether boxing is actually adding allocations on your hot path
