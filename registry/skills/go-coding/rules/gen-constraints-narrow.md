# gen-constraints-narrow

> Write the narrowest type constraint that satisfies your function's needs

## Why It Matters

A constraint that's too wide (`any`) gives up compile-time guarantees about what operations are valid; a constraint that's too narrow forces unnecessary type parameters or duplication. Picking the constraint that matches exactly what the function does with its values - comparison, ordering, arithmetic - documents intent and lets the compiler reject invalid instantiations early.

## Bad

```go
func Max[T any](a, b T) T { // any: can't actually compare a and b with <
	if a > b { // compile error: operator > not defined on T (any)
		return a
	}
	return b
}
```

## Good

```go
import "cmp"

func Max[T cmp.Ordered](a, b T) T { // exactly the constraint this function needs
	if a > b {
		return a
	}
	return b
}

func Max(a, b int) int // for a single concrete type, skip generics entirely - see gen-avoid-unnecessary-generics
```

## Building a Custom Constraint

```go
type Number interface {
	~int | ~int32 | ~int64 | ~float32 | ~float64
}

func Sum[T Number](values []T) T {
	var total T
	for _, v := range values {
		total += v
	}
	return total
}

// The ~ (tilde) allows types whose underlying type is int/float64/etc,
// not just the exact named types - so a defined type like `type Meters float64` still works:
type Meters float64
Sum([]Meters{1.5, 2.5}) // works because Meters' underlying type is float64
```

## Standard Constraints to Reach For First

```go
cmp.Ordered      // <, <=, >, >= comparable numeric/string types
comparable       // == and != (map keys, struct equality)
any              // no operations assumed - last resort, not a default
```

## Rule of Thumb

Start from what operations the function body actually performs, then pick (or define) the smallest constraint that permits exactly those operations - don't default to `any` out of convenience, and don't invent an elaborate constraint hierarchy for a function that only ever needs `comparable`.

## See Also

- [gen-comparable-constraint](gen-comparable-constraint.md) - The specific `comparable` constraint for map keys/equality
- [gen-avoid-unnecessary-generics](gen-avoid-unnecessary-generics.md) - When not to generify a function at all
- [api-avoid-any-overuse](api-avoid-any-overuse.md) - The broader API-design version of this same principle
