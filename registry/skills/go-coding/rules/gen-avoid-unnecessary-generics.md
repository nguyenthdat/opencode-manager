# gen-avoid-unnecessary-generics

> Don't add a type parameter when a concrete type or interface already works

## Why It Matters

Generics solve a specific problem: writing one implementation that works across multiple types without duplicating code or giving up type safety via `any`. When a function only ever operates on one concrete type, or when a small interface already captures the needed behavior, adding a type parameter is pure ceremony - it doesn't make the code more reusable, just harder to read and slower to compile.

## Bad

```go
func Double[T int](n T) T { // only ever instantiated with int - the type parameter adds nothing
	return n * 2
}

type Processor[T any] struct { // never instantiated with more than one type in practice
	items []T
}

func NewProcessor[T any](items []T) *Processor[T] {
	return &Processor[T]{items: items}
}

// Only ever used as:
p := NewProcessor[Order]([]Order{...})
```

## Good

```go
func Double(n int) int { // concrete type: simpler, same behavior, no instantiation overhead
	return n * 2
}

type OrderProcessor struct { // concrete type, since Order is the only thing ever processed
	items []Order
}

func NewOrderProcessor(items []Order) *OrderProcessor {
	return &OrderProcessor{items: items}
}
```

## When Generics Genuinely Pay Off

```go
// Used across many unrelated concrete types, with identical logic each time:
func Map[T, U any](items []T, fn func(T) U) []U {
	out := make([]U, len(items))
	for i, item := range items {
		out[i] = fn(item)
	}
	return out
}

doubled := Map([]int{1, 2, 3}, func(n int) int { return n * 2 })
names := Map(users, func(u User) string { return u.Name })
```

## Rule of Thumb

Introduce a type parameter only once you have (or clearly anticipate) at least two genuinely different concrete types that need the same logic. Until then, a concrete type is simpler to read, compiles faster, and produces clearer error messages.

## See Also

- [gen-constraints-narrow](gen-constraints-narrow.md) - Writing a good constraint once generics are actually warranted
- [api-avoid-any-overuse](api-avoid-any-overuse.md) - The related over-genericizing/under-genericizing balance for `any`
- [anti-premature-interface](anti-premature-interface.md) - The broader anti-pattern of premature abstraction
