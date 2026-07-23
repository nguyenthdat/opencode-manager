# gen-cmp-package

> Use the `cmp` package for ordering comparisons instead of hand-rolled logic

## Why It Matters

Comparing values for ordering (`<`, `>`) and computing a fallback default (`x if non-zero else y`) are common enough that the standard library provides `cmp.Compare`, `cmp.Less`, and `cmp.Or` (Go 1.21/1.22) to express them consistently and correctly - including subtle cases like NaN handling for floats, which hand-written comparisons often get wrong.

## Bad

```go
func compare(a, b float64) int {
	if a < b { // silently wrong when a or b is NaN: all comparisons with NaN are false
		return -1
	}
	if a > b {
		return 1
	}
	return 0
}

func firstNonEmpty(a, b, c string) string {
	if a != "" {
		return a
	}
	if b != "" {
		return b
	}
	return c
}
```

## Good

```go
import "cmp"

result := cmp.Compare(a, b) // -1, 0, or 1; correctly orders NaN as less than any other float

name := cmp.Or(a, b, c) // returns the first non-zero-value argument, or the last one

// Using cmp.Compare inside slices.SortFunc for struct fields:
slices.SortFunc(items, func(x, y Item) int {
	return cmp.Compare(x.Priority, y.Priority)
})

// Chaining multiple sort keys with cmp.Or:
slices.SortFunc(people, func(x, y Person) int {
	return cmp.Or(
		cmp.Compare(x.LastName, y.LastName),
		cmp.Compare(x.FirstName, y.FirstName),
	)
})
```

## `cmp.Or` for Defaults

```go
func loadTimeout(flagValue, envValue time.Duration) time.Duration {
	return cmp.Or(flagValue, envValue, 30*time.Second) // first non-zero wins
}
```

`cmp.Or` treats the Go zero value for the type as "empty" - for a `time.Duration` that's `0`, for a `string` that's `""`. It's a natural fit for "flag overrides env overrides default" style precedence chains.

## See Also

- [gen-slices-package](gen-slices-package.md) - `slices.SortFunc`/`slices.MaxFunc` consume `cmp`-style comparators
- [gen-constraints-narrow](gen-constraints-narrow.md) - `cmp.Ordered` as a generic constraint
- [type-iota-enum](type-iota-enum.md) - Comparing enum-like values consistently with `cmp.Compare`
