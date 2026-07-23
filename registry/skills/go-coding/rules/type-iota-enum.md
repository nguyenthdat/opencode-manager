# type-iota-enum

> Use `iota` to define enum-like constants, with a defined type for safety

## Why It Matters

Go has no native `enum` keyword. The idiomatic substitute is a defined integer type with a block of `const` values generated via `iota` - this gives you a distinct type the compiler can check (rejecting an arbitrary `int` where the enum type is expected), auto-incrementing values, and a natural place to attach a `String()` method.

## Bad

```go
const (
	StatusPending = 0 // plain int constants: any int is accepted where Status is expected
	StatusActive  = 1
	StatusClosed  = 2
)

func setStatus(s int) { /* ... */ } // accepts ANY int, not just valid statuses
setStatus(999)                       // compiles fine, is nonsense
```

## Good

```go
type Status int // a distinct, named type

const (
	StatusPending Status = iota // 0
	StatusActive                // 1 - iota increments automatically
	StatusClosed                // 2
)

func setStatus(s Status) { /* ... */ } // only accepts Status values (or untyped int constants)
```

## Skipping Values and Using Expressions

```go
type ByteSize float64

const (
	_           = iota // skip 0 - blank identifier discards the first iota value
	KB ByteSize = 1 << (10 * iota) // 1 << 10
	MB                             // 1 << 20 - iota keeps incrementing, expression repeats
	GB                             // 1 << 30
)
```

## Adding a Zero-Value Guard

```go
type Status int

const (
	StatusUnknown Status = iota // give the zero value an explicit, safe meaning
	StatusPending
	StatusActive
	StatusClosed
)

// A Status that's never explicitly set (its zero value) is clearly "Unknown",
// not accidentally mistaken for the first meaningful state.
```

## Validating an Enum Value

```go
func (s Status) Valid() bool {
	return s >= StatusUnknown && s <= StatusClosed
}
```

`iota`-based enums don't stop an out-of-range integer conversion (`Status(999)`) at compile time - validate at input boundaries (parsing, deserialization) rather than assuming the type alone guarantees a valid value.

## See Also

- [api-stringer-interface](api-stringer-interface.md) - Attaching a readable `String()` method to this type
- [type-stringer-enum](type-stringer-enum.md) - Enum-specific `Stringer` implementation and validation patterns
- [type-defined-types-safety](type-defined-types-safety.md) - The broader pattern of defined types for type safety
