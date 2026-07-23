# gen-maps-package

> Use the `maps` standard library package for common map operations

## Why It Matters

The `maps` package (stabilized in Go 1.21, with `maps.Values`/`maps.Keys` becoming iterators in 1.23) provides generic implementations of map operations that were previously hand-written on every project: copying, comparing, extracting keys/values, and deleting matching entries.

## Bad

```go
func keys(m map[string]int) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}

func cloneMap(m map[string]int) map[string]int {
	out := make(map[string]int, len(m))
	for k, v := range m {
		out[k] = v
	}
	return out
}

func mapsEqual(a, b map[string]int) bool {
	if len(a) != len(b) {
		return false
	}
	for k, v := range a {
		if bv, ok := b[k]; !ok || bv != v {
			return false
		}
	}
	return true
}
```

## Good

```go
import (
	"maps"
	"slices"
)

m := map[string]int{"a": 1, "b": 2}

clone := maps.Clone(m)
equal := maps.Equal(m, clone)
maps.DeleteFunc(m, func(k string, v int) bool { return v < 0 }) // remove matching entries in place

// Go 1.23+: Keys/Values return iter.Seq, composable with range-over-func and slices.Collect
keys := slices.Collect(maps.Keys(m))
values := slices.Collect(maps.Values(m))

for k, v := range m { // ranging directly is still the simplest option when you don't need a slice
	fmt.Println(k, v)
}
```

## Iterating in Sorted Key Order

```go
keys := slices.Sorted(maps.Keys(m)) // Go 1.23+: sorted, deterministic iteration order
for _, k := range keys {
	fmt.Println(k, m[k])
}
```

Map iteration order is intentionally randomized by the runtime; sort the keys explicitly whenever deterministic output matters (tests, generated code, user-facing listings).

## See Also

- [gen-slices-package](gen-slices-package.md) - The companion package for slice operations, used alongside `maps.Keys`/`maps.Values`
- [mem-map-preallocate](mem-map-preallocate.md) - Sizing maps built from these helpers
- [test-golden-files](test-golden-files.md) - Deterministic output (sorted keys) matters for reproducible golden-file tests
