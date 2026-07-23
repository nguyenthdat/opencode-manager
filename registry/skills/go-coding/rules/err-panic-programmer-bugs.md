# err-panic-programmer-bugs

> Panic only for programmer bugs, never for expected/recoverable conditions

## Why It Matters

`panic` unwinds the stack and (without `recover`) crashes the process. Reserve it for situations that indicate a bug in the program itself - a violated invariant, an impossible state - not for things that can legitimately happen at runtime, like a missing file, bad user input, or a network timeout. Those must be reported as `error` values so callers can handle them.

## Bad

```go
func Divide(a, b int) int {
	if b == 0 {
		panic("division by zero") // caller input, not a programmer bug - should be an error
	}
	return a / b
}

func ParseAge(s string) int {
	n, err := strconv.Atoi(s)
	if err != nil {
		panic(err) // untrusted input; the caller can't recover from a panic gracefully
	}
	return n
}
```

## Good

```go
func Divide(a, b int) (int, error) {
	if b == 0 {
		return 0, errors.New("divide: division by zero")
	}
	return a / b, nil
}

func ParseAge(s string) (int, error) {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0, fmt.Errorf("parse age %q: %w", s, err)
	}
	return n, nil
}
```

## Where Panic Is Appropriate

```go
// 1. Package-level initialization that can never fail in a correct build.
var re = regexp.MustCompile(`^\d+$`) // panics only if the pattern itself is wrong

// 2. An invariant the code guarantees elsewhere; reaching this means a bug exists.
func (s *state) mustBeLocked() {
	if !s.locked {
		panic("internal error: state accessed without lock")
	}
}

// 3. Truly unreachable branches (exhaustive switch defensive case).
switch dir {
case North, South, East, West:
	// ...
default:
	panic(fmt.Sprintf("unreachable: unknown direction %v", dir))
}
```

## Rule of Thumb

If the failure can be triggered by external input, a network call, the filesystem, or user action, it must be an `error`. If reaching the code path proves the program has a bug that no caller input could have avoided, `panic` is acceptable.

## See Also

- [err-recover-boundary](err-recover-boundary.md) - Recovering panics at the boundary of a goroutine/request
- [anti-panic-recover-control-flow](anti-panic-recover-control-flow.md) - Don't use panic/recover for normal control flow
- [type-avoid-panic-in-library](type-avoid-panic-in-library.md) - Libraries in particular must not panic on bad input
