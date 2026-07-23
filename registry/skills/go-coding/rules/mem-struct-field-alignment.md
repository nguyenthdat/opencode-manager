# mem-struct-field-alignment

> Order struct fields from largest to smallest to minimize padding

## Why It Matters

The Go compiler aligns each field to its own size boundary, inserting padding bytes between fields to satisfy alignment requirements. A struct with fields ordered arbitrarily can end up considerably larger than one with the same fields ordered largest-to-smallest, which matters for cache density and total memory use when you have many instances (e.g., a slice of millions of structs).

## Bad

```go
type Event struct {
	Active    bool   // 1 byte, then 7 bytes of padding to align the next int64
	Timestamp int64  // 8 bytes
	Count     int32  // 4 bytes
	Flag      bool   // 1 byte, then 3 bytes of padding to align the struct overall
}
// Size: 24 bytes on a 64-bit system
```

## Good

```go
type Event struct {
	Timestamp int64 // 8 bytes
	Count     int32 // 4 bytes
	Active    bool  // 1 byte
	Flag      bool  // 1 byte
	// 2 bytes of trailing padding to round up to an 8-byte multiple
}
// Size: 16 bytes on a 64-bit system - a third smaller, same fields
```

## Verifying With `go vet` / `fieldalignment`

```sh
go run golang.org/x/tools/go/analysis/passes/fieldalignment/cmd/fieldalignment@latest ./...
```

This tool (also available as a `golangci-lint` linter, `fieldalignment`) reports the optimal field order automatically and can rewrite the struct for you with `-fix`.

## When It's Not Worth Reordering

For structs with only a handful of live instances (e.g., a config struct created once), the few bytes saved don't matter and readability of a logically-grouped field order can take priority. Apply this rule to structs stored in bulk - slices, maps with millions of entries, or per-request/per-message types on a hot path.

## See Also

- [mem-assert-type-size](mem-assert-type-size.md) - Locking in the size win with a compile-time size assertion (from the analogous Rust rule concept, adapted below)
- [mem-slice-preallocate](mem-slice-preallocate.md) - Complementary memory optimization for collections of these structs
- [mem-copy-large-struct](mem-copy-large-struct.md) - Whether to pass this struct by value or pointer
