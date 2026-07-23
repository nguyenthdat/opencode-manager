# gen-generic-methods-limitation

> Remember methods can't introduce new type parameters beyond the receiver's

## Why It Matters

A generic type's methods can use the type parameters declared on the type itself, but Go does not allow a method to introduce *additional* type parameters of its own. Designing an API that assumes otherwise leads to a compile error late in development; know this constraint up front and design around it with a free (package-level) generic function instead.

## Bad

```go
type Container[T any] struct {
	items []T
}

// Does not compile: methods cannot have their own type parameter list.
func (c *Container[T]) MapTo[U any](fn func(T) U) *Container[U] {
	out := make([]U, len(c.items))
	for i, item := range c.items {
		out[i] = fn(item)
	}
	return &Container[U]{items: out}
}
```

## Good

```go
type Container[T any] struct {
	items []T
}

func NewContainer[T any](items []T) *Container[T] {
	return &Container[T]{items: items}
}

func (c *Container[T]) Items() []T {
	return c.items
}

// Use a free generic function instead of a generic method for the U type parameter.
func MapContainer[T, U any](c *Container[T], fn func(T) U) *Container[U] {
	out := make([]U, len(c.items))
	for i, item := range c.items {
		out[i] = fn(item)
	}
	return &Container[U]{items: out}
}

doubled := MapContainer(intContainer, func(n int) int { return n * 2 })
names := MapContainer(userContainer, func(u User) string { return u.Name })
```

## Why the Restriction Exists

Allowing a method to add its own type parameters would require Go's method sets and interface satisfaction rules to reason about a combinatorial explosion of instantiations per receiver type - a design tradeoff the language spec deliberately avoids. This is unlikely to change; design your generic APIs around free functions for any operation that needs to introduce a new type parameter beyond the receiver's.

## See Also

- [gen-avoid-unnecessary-generics](gen-avoid-unnecessary-generics.md) - Deciding whether a generic type is warranted in the first place
- [gen-constraints-narrow](gen-constraints-narrow.md) - Constraining the receiver's type parameter itself
- [api-accept-interfaces-return-structs](api-accept-interfaces-return-structs.md) - An alternative design that avoids this limitation entirely
