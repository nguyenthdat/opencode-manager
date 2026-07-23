# mem-slice-preallocate

> Use `make([]T, 0, n)` to preallocate slice capacity when the size is known

## Why It Matters

Appending to a nil or zero-capacity slice forces the runtime to repeatedly reallocate and copy the backing array as it grows (typically doubling capacity). When the final size is known or estimable ahead of time, preallocating avoids all of that copying in one call.

## Bad

```go
func toUpper(words []string) []string {
	var result []string // starts nil, capacity 0
	for _, w := range words {
		result = append(result, strings.ToUpper(w)) // reallocates repeatedly as it grows
	}
	return result
}
```

## Good

```go
func toUpper(words []string) []string {
	result := make([]string, 0, len(words)) // one allocation, correct final capacity
	for _, w := range words {
		result = append(result, strings.ToUpper(w))
	}
	return result
}
```

## When You Know the Exact Length, Not Just a Bound

```go
// If you're producing exactly one output element per input element via index,
// preallocate the length too and assign by index instead of appending.
func toUpperIndexed(words []string) []string {
	result := make([]string, len(words))
	for i, w := range words {
		result[i] = strings.ToUpper(w)
	}
	return result
}
```

## Benchmark Evidence

Preallocating eliminates the reallocation/copy steps entirely; the difference is easily visible with `testing.B` and `-benchmem`:

```
BenchmarkAppendNoPrealloc-8    500000   2450 ns/op   3968 B/op   12 allocs/op
BenchmarkAppendPrealloc-8     2000000    480 ns/op   1024 B/op    1 allocs/op
```

## When Preallocation Isn't Worth It

If the loop filters elements (so the final size is unknown and could be much smaller than the input), preallocating to `len(input)` may over-allocate. In that case, either preallocate to a reasonable estimate or leave it to `append`'s growth strategy - profile before micro-optimizing further.

## See Also

- [mem-map-preallocate](mem-map-preallocate.md) - The same idea applied to maps
- [mem-slice-aliasing-append](mem-slice-aliasing-append.md) - A correctness pitfall that also involves `append`
- [mem-benchmark-alloc](mem-benchmark-alloc.md) - Measuring allocation counts to validate this kind of change
