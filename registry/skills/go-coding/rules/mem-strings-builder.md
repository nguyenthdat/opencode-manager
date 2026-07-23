# mem-strings-builder

> Use `strings.Builder` instead of `+` concatenation in loops

## Why It Matters

Each `+` concatenation on strings allocates a brand-new string and copies both operands into it, because strings are immutable. Building a string incrementally in a loop with `+` or `+=` therefore reallocates and copies on every iteration - quadratic behavior for a string of length proportional to the loop count. `strings.Builder` accumulates into a growable internal buffer, copying only when it needs to grow.

## Bad

```go
func joinNames(names []string) string {
	result := ""
	for i, name := range names {
		if i > 0 {
			result += ", " // reallocates and copies the whole string so far, every time
		}
		result += name
	}
	return result
}
```

## Good

```go
func joinNames(names []string) string {
	var b strings.Builder
	b.Grow(estimateSize(names)) // optional but avoids intermediate regrowth if size is known
	for i, name := range names {
		if i > 0 {
			b.WriteString(", ")
		}
		b.WriteString(name)
	}
	return b.String()
}

func estimateSize(names []string) int {
	n := 0
	for _, s := range names {
		n += len(s) + 2
	}
	return n
}
```

## When `strings.Join` Is Simpler

```go
// For the common "join with a fixed separator" case, strings.Join is both
// clearer and already implemented with a single preallocated buffer internally.
result := strings.Join(names, ", ")
```

## Building From Mixed Types

```go
var b strings.Builder
fmt.Fprintf(&b, "user=%s id=%d active=%t\n", user.Name, user.ID, user.Active)
// Fprintf writes directly into the Builder - no intermediate string allocation
```

## Rules

- Reach for `strings.Builder` (or `strings.Join` for the simple join case) any time you're accumulating string output in a loop.
- Call `Grow(n)` up front when you can estimate the final size, to avoid intermediate reallocations as the builder grows.
- `strings.Builder` is not safe for concurrent use by multiple goroutines without external synchronization - it's meant for single-goroutine, single-owner accumulation.

## See Also

- [mem-avoid-interface-boxing](mem-avoid-interface-boxing.md) - Avoiding unnecessary formatting/boxing overhead more broadly
- [mem-buffered-io](mem-buffered-io.md) - The equivalent pattern for writing to `io.Writer` destinations
- [mem-string-byte-conversion](mem-string-byte-conversion.md) - Related string/byte allocation concerns
