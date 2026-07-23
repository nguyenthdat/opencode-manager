# mem-copy-large-struct

> Pass large structs by pointer to avoid copying them on every call

## Why It Matters

Go passes arguments, return values, and range variables by value by default. For a small struct (a few machine words), that's often cheaper than the indirection of a pointer. For a large struct, passing by value copies every field on every function call, every return, and every loop iteration - a cost that grows with the struct's size and call frequency.

## Bad

```go
type Report struct {
	Title    string
	Sections [50]Section // large fixed-size array embedded directly
	Metadata map[string]string
}

func Summarize(r Report) string { // copies the entire 50-element array on every call
	return r.Title
}

func ProcessAll(reports []Report) { // range copies each large Report into r every iteration
	for _, r := range reports {
		Summarize(r)
	}
}
```

## Good

```go
func Summarize(r *Report) string { // one pointer copied, not the whole struct
	return r.Title
}

func ProcessAll(reports []Report) {
	for i := range reports {
		Summarize(&reports[i]) // take the address instead of copying the element
	}
}
```

## Where Value Semantics Are Still Right

```go
// Small structs (a few words) are cheap to copy and often clearer/safer as values -
// no aliasing concerns, no risk of an unexpected mutation through a shared pointer.
type Point struct {
	X, Y float64
}

func Distance(a, b Point) float64 { // fine: 16 bytes, copy is essentially free
	dx, dy := a.X-b.X, a.Y-b.Y
	return math.Sqrt(dx*dx + dy*dy)
}
```

## Rule of Thumb

There's no fixed byte threshold, but as a starting point: structs larger than roughly three machine words (24 bytes on 64-bit), or containing large embedded arrays, are usually worth passing by pointer once profiling or benchmarking shows the copy matters. Don't apply this reflexively to every struct - value semantics are simpler to reason about and are the right default for genuinely small types.

## See Also

- [mem-struct-field-alignment](mem-struct-field-alignment.md) - Reducing a struct's size before deciding how to pass it
- [type-pointer-vs-value-receiver](type-pointer-vs-value-receiver.md) - The equivalent decision for methods, not just free functions
- [mem-slice-preallocate](mem-slice-preallocate.md) - Avoiding copies when building collections of these structs
