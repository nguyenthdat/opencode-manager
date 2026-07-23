# type-nil-interface-pitfall

> A nil concrete value stored in an interface is not itself `nil`

## Why It Matters

An interface value has two internal parts: a type and a value. It's `== nil` only when *both* are nil. If a nil pointer (or nil map, nil slice, nil channel) of a concrete type is assigned to an interface variable, the interface holds a non-nil type descriptor alongside a nil value - so `iface == nil` is false, which surprises nearly everyone the first time they hit it.

## Bad

```go
type Animal interface {
	Speak() string
}

type Dog struct{}

func (d *Dog) Speak() string { return "woof" }

func getAnimal(found bool) Animal {
	var d *Dog
	if found {
		d = &Dog{}
	}
	return d // BUG: always returns a non-nil Animal, even when d is a nil *Dog
}

func main() {
	a := getAnimal(false)
	if a != nil { // true! a's type is *Dog, even though the underlying pointer is nil
		fmt.Println(a.Speak()) // panics: nil pointer dereference inside Speak
	}
}
```

## Good

```go
func getAnimal(found bool) Animal {
	if !found {
		return nil // return the interface's genuine zero value directly
	}
	return &Dog{}
}

func main() {
	a := getAnimal(false)
	if a != nil {
		fmt.Println(a.Speak())
	} else {
		fmt.Println("no animal") // correctly reached
	}
}
```

## Detecting This With Reflection (Diagnostic Only, Not a Fix)

```go
func isNilInterface(i any) bool {
	if i == nil {
		return true
	}
	v := reflect.ValueOf(i)
	switch v.Kind() {
	case reflect.Ptr, reflect.Map, reflect.Slice, reflect.Chan, reflect.Func:
		return v.IsNil()
	default:
		return false
	}
}
```

Use this only for debugging or logging - the correct fix is always to avoid creating the situation in the first place, as shown above, not to sprinkle reflection-based nil checks through business logic.

## Rule of Thumb

Never return a concrete nil pointer through an interface-typed return value when the intent is "there is nothing here." Return the interface's own `nil` explicitly.

## See Also

- [err-nil-check-interface](err-nil-check-interface.md) - The `error`-specific instance of this exact pitfall
- [lint-staticcheck-enabled](lint-staticcheck-enabled.md) - `staticcheck` (`SA4023`) flags some instances of this automatically
- [type-zero-value-useful](type-zero-value-useful.md) - Designing types so their zero value behaves predictably
