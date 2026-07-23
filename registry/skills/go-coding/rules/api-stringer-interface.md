# api-stringer-interface

> Implement `fmt.Stringer` for types that need a readable string form

## Why It Matters

`fmt.Stringer` (`String() string`) is automatically used by every `fmt`-family function (`Println`, `Printf` with `%v`/`%s`, `errors.New`-wrapped messages that embed the value) and by many logging libraries. Implementing it once gives consistent, readable output everywhere a type is printed, instead of the default reflection-based dump of struct fields.

## Bad

```go
type Status int

const (
	StatusPending Status = iota
	StatusActive
	StatusClosed
)

func handle(s Status) {
	log.Printf("status changed to %v", s) // prints "status changed to 1" - meaningless to a reader
}
```

## Good

```go
type Status int

const (
	StatusPending Status = iota
	StatusActive
	StatusClosed
)

func (s Status) String() string {
	switch s {
	case StatusPending:
		return "pending"
	case StatusActive:
		return "active"
	case StatusClosed:
		return "closed"
	default:
		return fmt.Sprintf("Status(%d)", int(s))
	}
}

func handle(s Status) {
	log.Printf("status changed to %v", s) // prints "status changed to active"
}
```

## Generating `String()` Automatically

For enums with many values, hand-writing the switch is tedious and easy to let drift. `golang.org/x/tools/cmd/stringer` generates it from a `go:generate` directive:

```go
//go:generate stringer -type=Status
type Status int

const (
	StatusPending Status = iota
	StatusActive
	StatusClosed
)
```

```sh
go generate ./...
```

## A Pitfall: Calling `String()` Recursively

```go
func (s Status) String() string {
	return fmt.Sprintf("%v", s) // BUG: %v calls String() again -> infinite recursion
}
```

Inside `String()`, format the underlying value directly (`int(s)`) or use a different verb (`%d`) to avoid recursing back into `Stringer`.

## See Also

- [type-iota-enum](type-iota-enum.md) - Defining the enum-like type this method attaches to
- [type-stringer-enum](type-stringer-enum.md) - `Stringer` specifically for enum types, with more enum-focused examples
- [doc-comment-starts-with-name](doc-comment-starts-with-name.md) - Documenting the exported type and its `String()` method
