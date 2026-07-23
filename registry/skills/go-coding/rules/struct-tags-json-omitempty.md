# struct-tags-json-omitempty

> Understand exactly what `omitempty` does - and doesn't - omit

## Why It Matters

`omitempty` omits a field from JSON output when it holds its type's zero value - but "zero value" has specific, sometimes surprising meanings per type (`0` for numbers, `""` for strings, `nil`/length-0 for slices and maps, but notably *not* an empty, non-pointer `struct{}`). Assuming `omitempty` does something more general than this leads to fields that either never omit or omit when you didn't intend them to.

## Bad

```go
type Address struct {
	Street string `json:"street"`
	City   string `json:"city"`
}

type User struct {
	Name    string  `json:"name"`
	Age     int     `json:"age,omitempty"`    // omits when Age == 0, even if 0 is a MEANINGFUL value, not "unset"
	Address Address `json:"address,omitempty"` // omitempty has NO EFFECT on a non-pointer struct - it's never considered empty
}
```

```go
u := User{Name: "Alice", Age: 0} // Age genuinely is 0 (e.g. a newborn), not "unknown"
data, _ := json.Marshal(u)
// {"name":"Alice","address":{"street":"","city":""}}
// Age was omitted even though 0 was a real, meaningful value - and Address
// was NOT omitted despite being entirely zero-valued, because omitempty
// doesn't apply to struct types at all.
```

## Good

```go
type User struct {
	Name    string   `json:"name"`
	Age     *int     `json:"age,omitempty"`    // pointer: nil means "not provided", 0 means "explicitly zero"
	Address *Address `json:"address,omitempty"` // pointer: omitempty now works, since nil *Address is the zero value
}

age := 0
u := User{Name: "Alice", Age: &age} // explicitly zero, and will still be marshaled since Age != nil
data, _ := json.Marshal(u)
// {"name":"Alice","age":0}
```

## Go 1.24+: `omitzero` for a Clearer, Type-Aware Alternative

```go
type User struct {
	Name    string  `json:"name"`
	Address Address `json:"address,omitzero"` // Go 1.24+: omits if Address.IsZero() (if defined) or is the zero value
}
```

`omitzero` (added alongside the new `encoding/json/v2` work) is designed to correctly handle struct types by checking for an `IsZero() bool` method or literal zero-value equality, addressing exactly the `omitempty`-on-structs gap shown above.

## Rule of Thumb

For any field where "not provided" must be distinguishable from "explicitly the zero value" (an optional integer, an optional nested object), use a pointer (or, on Go 1.24+, `omitzero` with an appropriate type) rather than assuming `omitempty` alone solves this for every field type.

## See Also

- [type-struct-tags-correctness](type-struct-tags-correctness.md) - General struct tag syntax correctness this rule builds on
- [mem-nil-slice-vs-empty](mem-nil-slice-vs-empty.md) - A related JSON-serialization nil-vs-empty distinction
- [type-zero-value-useful](type-zero-value-useful.md) - Designing types whose zero value has a clear, intentional meaning
