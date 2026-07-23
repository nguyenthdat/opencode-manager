# mem-map-preallocate

> Use `make(map[K]V, n)` to size-hint a map when the count is known

## Why It Matters

Like slices, Go maps grow their internal bucket storage as entries are added. Providing a size hint via `make(map[K]V, n)` lets the runtime allocate enough bucket capacity up front, avoiding incremental growth and rehashing as the map fills - especially valuable when building a large map from a known-size input in one pass.

## Bad

```go
func indexByID(users []User) map[string]User {
	index := map[string]User{} // starts with minimal bucket capacity
	for _, u := range users {
		index[u.ID] = u // triggers repeated growth as the map crosses load-factor thresholds
	}
	return index
}
```

## Good

```go
func indexByID(users []User) map[string]User {
	index := make(map[string]User, len(users)) // sized hint avoids incremental regrowth
	for _, u := range users {
		index[u.ID] = u
	}
	return index
}
```

## The Hint Is a Hint, Not a Hard Cap

```go
m := make(map[string]int, 10)
for i := 0; i < 1000; i++ {
	m[fmt.Sprintf("key%d", i)] = i // perfectly legal - the map still grows beyond the hint
}
```

Passing a size hint never limits how large the map can grow; it only avoids some of the reallocation cost during that initial fill when the estimate is accurate.

## Benchmark Evidence

```
BenchmarkMapNoPrealloc-8    500    2 700 000 ns/op   612000 B/op   118 allocs/op
BenchmarkMapPrealloc-8      800    1 400 000 ns/op   410000 B/op    12 allocs/op
```

(Illustrative numbers - actual gains depend on entry count and key/value size; measure with your own workload via `mem-benchmark-alloc`.)

## When to Skip It

If the final size is unknown or highly variable (e.g., filtering an unknown fraction of a stream into a map), a size hint based on a rough upper bound is still useful, but don't over-engineer a precise count for maps built rarely or with few entries - the win only matters at meaningful scale.

## See Also

- [mem-slice-preallocate](mem-slice-preallocate.md) - The same idea applied to slices
- [mem-benchmark-alloc](mem-benchmark-alloc.md) - Measuring the actual allocation savings for your data
- [gen-maps-package](gen-maps-package.md) - Standard-library helpers for common map operations
