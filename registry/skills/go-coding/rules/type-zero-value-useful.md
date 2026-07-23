# type-zero-value-useful

> Design types so their zero value is immediately useful

## Why It Matters

Go always gives you a zero value - for a struct, every field set to its own zero value - whether or not you call a constructor. Designing a type so its zero value is already valid and usable ("useful zero value") means callers can declare `var x T` and start using it immediately, with no `New()` call required, no nil-pointer surprises, and no partially-initialized state to worry about.

## Bad

```go
type Buffer struct {
	data []byte
	pos  int
}

func NewBuffer() *Buffer {
	return &Buffer{data: make([]byte, 0, 64)} // "required" just to get a working Buffer
}

func (b *Buffer) Write(p []byte) (int, error) {
	if b.data == nil { // defensive check needed because the zero value wasn't designed to work
		return 0, errors.New("buffer not initialized")
	}
	b.data = append(b.data, p...)
	return len(p), nil
}
```

## Good

```go
type Buffer struct {
	data []byte // nil is a perfectly usable starting point for append
	pos  int
}

func (b *Buffer) Write(p []byte) (int, error) {
	b.data = append(b.data, p...) // append works fine on a nil slice - no special-casing needed
	return len(p), nil
}

var b Buffer // usable immediately, no constructor required
b.Write([]byte("hello"))
```

## Standard Library Examples

```go
var buf bytes.Buffer     // usable immediately
var mu sync.Mutex        // zero value is an unlocked mutex, ready to use
var wg sync.WaitGroup    // zero value is ready to Add/Wait
var sb strings.Builder   // zero value is ready to WriteString
```

None of these require a constructor - their designers specifically chose zero-value-friendly internal representations (nil slices that work with `append`, an internal state where "0/false/nil" naturally means "not yet used").

## When a Constructor Is Still Necessary

If valid construction genuinely requires external input (a file handle, a required configuration value, a network dial), a zero value can't be made useful, and `New(...)` returning `(*T, error)` is the right shape - don't force a useful-zero-value design where it doesn't fit the type's actual invariants.

## See Also

- [api-constructor-new-prefix](api-constructor-new-prefix.md) - When a constructor is warranted instead of relying on the zero value
- [mem-nil-slice-vs-empty](mem-nil-slice-vs-empty.md) - Nil slices specifically being safe to use without initialization
- [struct-constructor-validation](struct-constructor-validation.md) - Validating invariants when a useful zero value isn't possible
