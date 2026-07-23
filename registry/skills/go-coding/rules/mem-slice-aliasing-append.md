# mem-slice-aliasing-append

> Understand slice aliasing: `append` and re-slicing can silently share backing arrays

## Why It Matters

A Go slice is a view (pointer, length, capacity) over a backing array. Two slices derived from the same array can alias each other's memory. Appending to one, when capacity allows, mutates data another slice still references - producing bugs that only appear once capacity happens to be exceeded (or not).

## Bad

```go
func removeFirst(s []int) []int {
	return s[1:] // shares the same backing array as s
}

func process(data []int) {
	rest := removeFirst(data)
	rest = append(rest, 99) // may silently overwrite data[len(data)-1] if capacity allows!
	fmt.Println(data)       // surprising: data's last element may have changed
}

func splitBatches(items []Item, batchSize int) [][]Item {
	var batches [][]Item
	for i := 0; i < len(items); i += batchSize {
		end := min(i+batchSize, len(items))
		batches = append(batches, items[i:end]) // all batches alias the same backing array
	}
	return batches // later appends to one batch can corrupt the data another batch sees
}
```

## Good

```go
func removeFirstCopy(s []int) []int {
	out := make([]int, len(s)-1)
	copy(out, s[1:]) // independent backing array - safe to mutate/append freely
	return out
}

// Or, when it's fine to share memory but appends must never happen on the
// sub-slice, limit its capacity to prevent silent overwrites:
func removeFirstBounded(s []int) []int {
	return s[1:len(s):len(s)] // three-index slice: cap == len, forces append to reallocate
}
```

## The Three-Index Slice Trick

```go
sub := s[low:high:max] // len = high-low, cap = max-low
// Setting max == high (as in s[1:len(s):len(s)]) guarantees any append on sub
// triggers a fresh allocation instead of silently writing into s's backing array.
```

## Rule of Thumb

- Never assume a slice you didn't allocate yourself is safe to `append` to without checking whether the result might alias data the caller still holds.
- When splitting or slicing for read-only use, plain re-slicing is fine and free (no copy).
- When a sub-slice will be appended to independently, either copy it or cap it with the three-index form.

## See Also

- [mem-slice-preallocate](mem-slice-preallocate.md) - Preallocating avoids unexpected reallocation during `append`
- [mem-nil-slice-vs-empty](mem-nil-slice-vs-empty.md) - Another slice semantics subtlety
- [anti-defer-in-loop-leak](anti-defer-in-loop-leak.md) - A different category of subtle per-iteration resource bug
