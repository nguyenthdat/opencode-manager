# name-interface-er-suffix

> Name single-method interfaces with an `-er` suffix derived from the method

## Why It Matters

Naming a one-method interface after what it *does* (`Reader` for `Read`, `Writer` for `Write`, `Closer` for `Close`) makes its purpose obvious from the name alone, and matches the entire standard library's convention. A vague name (`IReader`, `ReadInterface`, `ReadableThing`) adds no information the method signature didn't already provide.

## Bad

```go
type IStringer interface { // "I" prefix is a C#/Java convention, not Go's
	ToString() string
}

type ReadableInterface interface { // redundant "Interface" suffix, and not derived from the verb
	Read(p []byte) (int, error)
}
```

## Good

```go
type Reader interface {
	Read(p []byte) (int, error)
}

type Writer interface {
	Write(p []byte) (int, error)
}

type Closer interface {
	Close() error
}

type Validator interface {
	Validate() error
}

type Stringer interface { // from the fmt package
	String() string
}
```

## Composing Named Single-Method Interfaces

```go
type ReadCloser interface { // composed name reflects the composed capability
	Reader
	Closer
}
```

## When the Verb Doesn't Form a Natural `-er` Word

```go
// Occasionally the natural English form is awkward ("Marshaler" not "Marshalter");
// use the closest natural agent noun rather than forcing a mechanical suffix:
type Marshaler interface {
	MarshalJSON() ([]byte, error)
}

type Unmarshaler interface {
	UnmarshalJSON([]byte) error
}
```

## See Also

- [api-small-interfaces](api-small-interfaces.md) - Why single-method interfaces are the target this naming convention serves
- [name-mixedcaps](name-mixedcaps.md) - The general casing convention this naming pattern follows
- [api-stringer-interface](api-stringer-interface.md) - `Stringer`, the most commonly implemented `-er` interface
