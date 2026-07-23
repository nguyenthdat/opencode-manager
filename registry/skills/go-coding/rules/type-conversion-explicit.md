# type-conversion-explicit

> Prefer explicit, checked type conversions; avoid `unsafe.Pointer` unless truly necessary

## Why It Matters

Go requires explicit conversions between distinct numeric or named types, which is a deliberate safety feature - it forces you to acknowledge a potential truncation or reinterpretation at the call site. `unsafe.Pointer` bypasses the type system entirely and can produce memory corruption or undefined behavior if the layout assumptions it relies on are ever wrong; it should be reserved for narrow, well-justified cases (interfacing with C, extreme performance-critical reinterpretation), never as a shortcut around normal conversions.

## Bad

```go
func toInt32(n int64) int32 {
	return int32(n) // silently truncates if n doesn't fit - no overflow check at all
}

func reinterpret(f float64) int64 {
	return *(*int64)(unsafe.Pointer(&f)) // unsafe.Pointer used where math.Float64bits already exists
}
```

## Good

```go
func toInt32(n int64) (int32, error) {
	if n < math.MinInt32 || n > math.MaxInt32 {
		return 0, fmt.Errorf("value %d overflows int32", n)
	}
	return int32(n), nil
}

func reinterpret(f float64) uint64 {
	return math.Float64bits(f) // standard library function for this exact, well-defined reinterpretation
}
```

## When `unsafe` Is Legitimately Warranted

```go
// Zero-copy conversion between string and []byte, avoiding an allocation,
// is one of the few broadly-accepted uses of unsafe - and only when you can
// guarantee the byte slice is never mutated afterward:
func unsafeString(b []byte) string {
	return unsafe.String(unsafe.SliceData(b), len(b)) // Go 1.20+ safer unsafe helpers
}
```

Go 1.20 added `unsafe.String`/`unsafe.SliceData`/`unsafe.StringData`, which are safer, better-defined replacements for the manual pointer arithmetic used in older Go code - prefer these over raw `unsafe.Pointer` casts when a genuine zero-copy conversion is required.

## Rule of Thumb

- Reach for a checked conversion (with an explicit range check) whenever a numeric conversion could lose information.
- Reach for `unsafe` only when there's no safe standard-library alternative (`math.Float64bits`, the Go 1.20 `unsafe.String`/`unsafe.Slice` helpers) and the performance or interop need is proven, not assumed.
- Every `unsafe` usage should have a comment explaining exactly which invariant makes it safe in this specific case.

## See Also

- [mem-string-byte-conversion](mem-string-byte-conversion.md) - The ordinary, safe string/[]byte conversion this rule contrasts with the unsafe zero-copy variant
- [err-panic-programmer-bugs](err-panic-programmer-bugs.md) - Truncation/overflow bugs as a class of programmer error to guard against
- [gen-constraints-narrow](gen-constraints-narrow.md) - Using generics/constraints to avoid needing ad hoc conversions in the first place
