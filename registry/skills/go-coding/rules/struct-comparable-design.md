# struct-comparable-design

> Design a struct deliberately when it needs to support `==` or be a map key

## Why It Matters

A struct is comparable with `==`/`!=` (and usable as a map key) only if every one of its fields is itself comparable - adding a single slice, map, or function-typed field to an otherwise-comparable struct silently makes the whole struct non-comparable, which surfaces only as a compile error wherever that comparison or map usage already existed.

## Bad

```go
type Point struct {
	X, Y  float64
	Tags  []string // slices are not comparable
}

func dedupe(points []Point) map[Point]bool { // compile error: invalid map key type Point (missing comparable)
	seen := map[Point]bool{}
	for _, p := range points {
		seen[p] = true
	}
	return seen
}
```

## Good

```go
type Point struct {
	X, Y float64 // every field is comparable, so Point itself is comparable
}

func dedupe(points []Point) map[Point]bool {
	seen := map[Point]bool{}
	for _, p := range points {
		seen[p] = true
	}
	return seen
}

// If tags are genuinely needed, keep them in a separate, non-comparable
// structure rather than breaking Point's comparability:
type TaggedPoint struct {
	Point
	Tags []string
}
```

## `comparable` as a Generic Constraint Documents the Requirement

```go
func Unique[T comparable](items []T) []T { // the compiler enforces that any T used here must be comparable
	seen := make(map[T]bool, len(items))
	var out []T
	for _, item := range items {
		if !seen[item] {
			seen[item] = true
			out = append(out, item)
		}
	}
	return out
}

Unique([]Point{{1, 2}, {1, 2}, {3, 4}}) // fine: Point is comparable
// Unique([]TaggedPoint{...})           // compile error: TaggedPoint is not comparable
```

## `reflect.DeepEqual`/`cmp.Equal` as an Escape Hatch

If a type genuinely needs deep, field-by-field comparison despite containing slices or maps, use `reflect.DeepEqual` or (preferably, in tests) `github.com/google/go-cmp/cmp.Equal` instead of trying to force the type to satisfy `comparable` - don't restructure a type's fields awkwardly just to enable `==` where a proper deep-equality check is what's actually needed.

## See Also

- [gen-comparable-constraint](gen-comparable-constraint.md) - The generic constraint that formalizes this requirement
- [type-struct-tags-correctness](type-struct-tags-correctness.md) - A related struct-design correctness concern
- [struct-avoid-god-struct](struct-avoid-god-struct.md) - Splitting fields by concern, which also tends to keep comparable data separate from non-comparable data
