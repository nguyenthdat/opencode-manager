# gen-slices-package

> Use the `slices` standard library package instead of hand-rolled loops

## Why It Matters

Before Go 1.21, common slice operations (contains, sort, reverse, equal, binary search) had to be hand-written or imported from third-party helper packages. The standard `slices` package now provides generic, well-tested implementations of all of these, reducing boilerplate and eliminating a common source of off-by-one bugs.

## Bad

```go
func contains(items []string, target string) bool {
	for _, item := range items {
		if item == target {
			return true
		}
	}
	return false
}

func reverse(items []int) {
	for i, j := 0, len(items)-1; i < j; i, j = i+1, j-1 {
		items[i], items[j] = items[j], items[i]
	}
}

func equal(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
```

## Good

```go
import "slices"

slices.Contains(items, target)
slices.Reverse(items)         // in place
slices.Equal(a, b)
slices.Sort(items)            // sorts in place using cmp.Ordered
slices.SortFunc(items, func(a, b Item) int { return cmp.Compare(a.Priority, b.Priority) })
slices.Index(items, target)   // -1 if not found
slices.Max(items)
slices.Min(items)
slices.Clone(items)           // shallow copy
slices.Compact(items)         // removes consecutive duplicates in place
slices.Delete(items, 2, 4)    // removes items[2:4], shifting the rest down
slices.Insert(items, 1, x)    // inserts x at index 1
```

## Sorting Structs by a Field

```go
type Item struct {
	Name     string
	Priority int
}

items := []Item{{"a", 3}, {"b", 1}, {"c", 2}}
slices.SortFunc(items, func(x, y Item) int {
	return cmp.Compare(x.Priority, y.Priority)
})
```

## Migrating From `sort.Slice`

```go
// Old: sort.Slice loses type safety and allocates a closure every call
sort.Slice(items, func(i, j int) bool { return items[i].Priority < items[j].Priority })

// New: slices.SortFunc with cmp.Compare, same result, generic and typed
slices.SortFunc(items, func(a, b Item) int { return cmp.Compare(a.Priority, b.Priority) })
```

## See Also

- [gen-maps-package](gen-maps-package.md) - The equivalent standard package for maps
- [gen-cmp-package](gen-cmp-package.md) - The `cmp` package used by `SortFunc`/`CompareFunc`
- [mem-slice-preallocate](mem-slice-preallocate.md) - Complementary allocation guidance for slices built with these helpers
