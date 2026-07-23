# type-stringer-enum

> Give enum-like types a `String()` method and validate values at the boundary

## Why It Matters

An `iota`-based enum prints as a bare integer by default (`fmt.Println(StatusActive)` prints `1`), which is meaningless in logs and error messages. Pairing the enum with a `String()` method - and a `Valid()`/parsing function at input boundaries - turns it into a genuinely safe, self-documenting type instead of "an int with some named constants."

## Bad

```go
type Status int

const (
	StatusPending Status = iota
	StatusActive
	StatusClosed
)

func handle(s Status) {
	log.Printf("status: %d", s) // "status: 1" - which one is that, again?
}

func parseStatus(s string) Status {
	n, _ := strconv.Atoi(s) // silently accepts garbage, discards the parse error
	return Status(n)        // no validation - Status(999) is constructible
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

func ParseStatus(s string) (Status, error) {
	switch s {
	case "pending":
		return StatusPending, nil
	case "active":
		return StatusActive, nil
	case "closed":
		return StatusClosed, nil
	default:
		return 0, fmt.Errorf("invalid status %q", s)
	}
}

func handle(s Status) {
	log.Printf("status: %s", s) // "status: active"
}
```

## Supporting JSON Round-Tripping

```go
func (s Status) MarshalJSON() ([]byte, error) {
	return json.Marshal(s.String())
}

func (s *Status) UnmarshalJSON(data []byte) error {
	var str string
	if err := json.Unmarshal(data, &str); err != nil {
		return err
	}
	parsed, err := ParseStatus(str)
	if err != nil {
		return err
	}
	*s = parsed
	return nil
}
```

## See Also

- [type-iota-enum](type-iota-enum.md) - Defining the underlying enum type and constants
- [api-stringer-interface](api-stringer-interface.md) - The general `fmt.Stringer` contract this rule specializes for enums
- [type-struct-tags-correctness](type-struct-tags-correctness.md) - Related JSON (de)serialization correctness concerns
