# type-defined-types-safety

> Use defined types instead of primitive obsession for domain concepts

## Why It Matters

`string`, `int`, and other primitives can represent almost anything, which means the compiler can't stop you from passing a user ID where an order ID was expected - both are just `string`. Wrapping a primitive in a defined type (`type UserID string`) makes the compiler enforce the distinction, at zero runtime cost.

## Bad

```go
func Transfer(fromUserID, toUserID string, amount int) error {
	// ...
	return nil
}

// Compiles fine, but the arguments are swapped - both are just "string":
Transfer(orderID, userID, 100)
```

## Good

```go
type UserID string
type OrderID string

func Transfer(fromUserID, toUserID UserID, amount int) error {
	// ...
	return nil
}

// Compile error: cannot use orderID (variable of type OrderID) as UserID value
Transfer(orderID, userID, 100)
```

## Attaching Behavior to the Defined Type

```go
type Meters float64
type Feet float64

func (m Meters) ToFeet() Feet {
	return Feet(m * 3.28084)
}

func (m Meters) String() string {
	return fmt.Sprintf("%.2fm", float64(m))
}

// Meters and Feet can never be silently mixed up in an arithmetic expression -
// converting between them requires an explicit method call or conversion.
```

## When Plain Primitives Are Fine

For truly generic, context-free values (a loop counter, an array index, a raw byte count with no domain meaning), a plain primitive is simpler and a defined type would be over-engineering. Reach for a defined type specifically when a primitive is standing in for a domain concept that could be confused with another value of the same primitive type.

## See Also

- [type-iota-enum](type-iota-enum.md) - Applying a defined type specifically to enum-like constant sets
- [gen-comparable-constraint](gen-comparable-constraint.md) - Defined types remain comparable as long as their underlying type is
- [api-variadic-config](api-variadic-config.md) - Using distinct types to disambiguate similarly-typed parameters
