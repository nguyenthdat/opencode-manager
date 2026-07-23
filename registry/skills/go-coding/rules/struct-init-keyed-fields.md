# struct-init-keyed-fields

> Always use keyed fields in struct literals for exported/cross-package structs

## Why It Matters

A positional struct literal (`Point{1, 2}`) silently breaks the moment someone reorders, inserts, or removes a field in the struct's definition - the compiler happily reassigns values to the wrong fields as long as the count and types still line up. A keyed literal (`Point{X: 1, Y: 2}`) is immune to field reordering and self-documents which value goes where.

## Bad

```go
type User struct {
	ID    string
	Name  string
	Email string
}

u := User{"1", "Alice", "alice@example.com"} // positional: which value is which, at a glance?

// Now imagine a teammate adds a field in the middle of the struct definition:
type User struct {
	ID       string
	Verified bool   // newly inserted field
	Name     string
	Email    string
}
// Every existing positional literal like the one above now silently assigns
// "Alice" to Verified (a bool) - actually, this specific case would fail to
// compile due to type mismatch, but reordering same-typed fields would NOT
// fail to compile, and would silently swap values instead.
```

## Good

```go
u := User{
	ID:    "1",
	Name:  "Alice",
	Email: "alice@example.com",
}

// Adding, removing, or reordering fields in the struct definition has no
// effect on this literal's correctness - each value is bound to its field by name.
```

## `go vet`'s `composites` Check

`go vet` includes a check (via `golangci-lint`'s `govet` integration) that flags unkeyed composite literals for structs from other packages, precisely because those are the riskiest case - you don't control the struct's field order and can't easily notice if it changes:

```go
p := image.Point{1, 2} // go vet: composite literal uses unkeyed fields
```

## Where Positional Literals Are Still Fine

```go
// Small, well-known, unlikely-to-change types local to your own package,
// especially ones acting more like a tuple than a named-fields record:
type pair struct{ a, b int }
p := pair{1, 2} // low risk: local, tiny, and any reordering would be an obviously deliberate edit
```

## See Also

- [api-table-driven-config](api-table-driven-config.md) - Config structs, a common case that benefits from keyed literals
- [lint-govet-enabled](lint-govet-enabled.md) - The `composites` check that flags unkeyed literals across packages
- [struct-constructor-validation](struct-constructor-validation.md) - Constructors as an alternative to direct struct literals entirely
