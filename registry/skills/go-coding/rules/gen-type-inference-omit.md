# gen-type-inference-omit

> Omit explicit type arguments when the compiler can infer them

## Why It Matters

Go's compiler infers generic type arguments from the arguments passed to a function in most common cases. Spelling out the type argument explicitly when it's unambiguous just adds visual noise; it's only needed when inference genuinely can't determine the type (e.g., from a return-type-only context).

## Bad

```go
result := Map[int, string](numbers, func(n int) string { // explicit args are redundant here
	return strconv.Itoa(n)
})

doubled := Double[int](5) // the argument 5 already tells the compiler T is int
```

## Good

```go
result := Map(numbers, func(n int) string { // inferred from numbers ([]int) and the func's return type
	return strconv.Itoa(n)
})

doubled := Double(5) // inferred from the argument
```

## When Explicit Type Arguments Are Necessary

```go
// Inference has nothing to work from when the type only appears in the return value:
zero := Zero[int]() // no arguments to infer T from

func Zero[T any]() T {
	var z T
	return z
}

// Or when the inferred type would be wrong/ambiguous - e.g. an untyped constant
// that could satisfy multiple constraint types:
var f float64 = Identity[float64](2) // without the hint, 2 could infer as int
```

## A Common Case: Instantiating a Generic Type

```go
// Instantiating a generic *type* (not calling a generic function) usually
// does require the type argument, since there's no value to infer it from:
var s Stack[int]
s.Push(1)
```

## Rule of Thumb

Write the call without type arguments first; add them back only if the compiler reports an inference failure or infers something other than what you intended. Don't add them preemptively "for clarity" - the argument types at the call site already make the instantiation clear to a reader.

## See Also

- [gen-avoid-unnecessary-generics](gen-avoid-unnecessary-generics.md) - Whether the function should be generic at all
- [gen-constraints-narrow](gen-constraints-narrow.md) - Constraints that inference relies on to validate the call
