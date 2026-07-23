# mem-string-byte-conversion

> Avoid unnecessary `[]byte` <-> `string` conversions in hot paths

## Why It Matters

Converting between `string` and `[]byte` copies the underlying data, because strings are immutable and byte slices are not - the runtime can't safely let them share a backing array in the general case. Repeating this conversion inside a loop or on a hot request path adds allocation and copy overhead that's easy to avoid by choosing one representation and sticking with it.

## Bad

```go
func containsWord(data []byte, word string) bool {
	return strings.Contains(string(data), word) // copies all of data into a new string
}

func hashAll(lines []string) [][]byte {
	var hashes [][]byte
	for _, line := range lines {
		sum := sha256.Sum256([]byte(line)) // copies line into a new []byte each time
		hashes = append(hashes, sum[:])
	}
	return hashes
}
```

## Good

```go
func containsWord(data []byte, word string) bool {
	return bytes.Contains(data, []byte(word)) // one conversion instead of copying the larger buffer
}

func hashAll(lines []string) [][]byte {
	hashes := make([][]byte, len(lines))
	for i, line := range lines {
		sum := sha256.Sum256([]byte(line)) // unavoidable here - sha256 needs []byte
		hashes[i] = sum[:]
	}
	return hashes
}
```

## The Compiler Optimizes Some Cases Already

```go
// These specific patterns are recognized by the compiler and avoid an allocation:
m := map[string]int{}
if v, ok := m[string(byteSlice)]; ok { // no allocation: compiler special-cases map lookups
	use(v)
}

for i, c := range string(byteSlice) { // no allocation when only ranging, not storing the string
	_ = c
}
```

Outside of these recognized patterns, assume a conversion allocates and copies.

## Pick One Representation for a Hot Path

If a function is called frequently with data that's naturally `[]byte` (e.g., from `io.Reader`), keep it as `[]byte` throughout and use the `bytes` package's equivalents (`bytes.Contains`, `bytes.Split`, `bytes.TrimSpace`) instead of converting to `string` to use the `strings` package.

## See Also

- [mem-strings-builder](mem-strings-builder.md) - Avoiding repeated allocation when building strings
- [api-io-reader-writer](api-io-reader-writer.md) - Working with `[]byte`-oriented interfaces
- [mem-benchmark-alloc](mem-benchmark-alloc.md) - Measuring whether a conversion is actually a hot-path cost
