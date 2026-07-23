# gen-comparable-constraint

> Use the `comparable` constraint for generic code that needs `==`/`!=` or map keys

## Why It Matters

Not every type supports `==`/`!=` (slices, maps, and functions don't) or can be used as a map key. The built-in `comparable` constraint lets the compiler enforce, at the call site, that only types supporting equality comparison can instantiate a generic function - catching an invalid instantiation before it ever runs.

## Bad

```go
func Unique[T any](items []T) []T { // any doesn't guarantee == is valid
	seen := map[T]bool{}          // compile error: invalid map key type T (missing comparable)
	var out []T
	for _, item := range items {
		if !seen[item] {
			seen[item] = true
			out = append(out, item)
		}
	}
	return out
}
```

## Good

```go
func Unique[T comparable](items []T) []T {
	seen := make(map[T]bool, len(items))
	out := make([]T, 0, len(items))
	for _, item := range items {
		if seen[item] {
			continue
		}
		seen[item] = true
		out = append(out, item)
	}
	return out
}

Unique([]int{1, 2, 2, 3})           // ok: int is comparable
Unique([]string{"a", "b", "a"})     // ok: string is comparable
// Unique([][]int{{1}, {2}})        // compile error: []int is not comparable
```

## Contains / IndexOf Style Helpers

```go
func Contains[T comparable](items []T, target T) bool {
	for _, item := range items {
		if item == target {
			return true
		}
	}
	return false
}
```

(The standard library already provides this as `slices.Contains` - see `gen-slices-package` - prefer it over hand-rolling.)

## `comparable` Doesn't Mean "Ordered"

`comparable` only guarantees `==`/`!=`; it says nothing about `<`/`>`. For sorting or min/max, use `cmp.Ordered` instead (see `gen-constraints-narrow`). Structs are comparable only if every field is comparable - a struct containing a slice or map field is not.

## See Also

- [gen-constraints-narrow](gen-constraints-narrow.md) - Choosing between `comparable`, `cmp.Ordered`, and custom constraints
- [gen-slices-package](gen-slices-package.md) - Standard library functions that already use `comparable` for you
- [struct-comparable-design](struct-comparable-design.md) - Designing a struct to remain comparable
