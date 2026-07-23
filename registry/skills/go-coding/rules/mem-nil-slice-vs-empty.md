# mem-nil-slice-vs-empty

> Know the difference between a nil slice and an empty (non-nil) slice

## Why It Matters

A nil slice (`var s []T`) and an empty slice (`s := []T{}` or `make([]T, 0)`) behave identically for `len()`, `append()`, and `range` - but they differ in JSON marshaling (`null` vs `[]`) and in explicit `== nil` checks. Conflating them causes subtle API and serialization bugs, especially at JSON boundaries.

## Bad

```go
type Response struct {
	Items []Item `json:"items"`
}

func GetItems(filter Filter) Response {
	var items []Item // nil if nothing matches
	for _, i := range allItems {
		if filter.Matches(i) {
			items = append(items, i)
		}
	}
	return Response{Items: items}
	// Marshals to {"items":null} when nothing matched - many API clients choke
	// on null where they expect an array, e.g. `for item of items` in JS.
}
```

## Good

```go
func GetItems(filter Filter) Response {
	items := make([]Item, 0, len(allItems)) // non-nil, even if it ends up empty
	for _, i := range allItems {
		if filter.Matches(i) {
			items = append(items, i)
		}
	}
	return Response{Items: items}
	// Marshals to {"items":[]} consistently, matching client expectations.
}
```

## Both Are Safe to Range and Append

```go
var nilSlice []int
emptySlice := []int{}

len(nilSlice)    // 0
len(emptySlice)  // 0
nilSlice == nil  // true
emptySlice == nil // false - this is the only functional difference that matters
for range nilSlice {} // fine, zero iterations, no panic
nilSlice = append(nilSlice, 1) // fine, allocates on first append
```

## Where the Distinction Matters

| Context | Behavior difference |
|---|---|
| `encoding/json` marshal | nil -> `null`, empty -> `[]` |
| `s == nil` check | only meaningful if code actually branches on it |
| `reflect.DeepEqual(nil, []T{})` | `false` - they are not deeply equal |

For internal-only slices where nothing checks `== nil` or serializes to JSON, either form is fine and idiomatic Go code often leaves internal slices nil until first append. Reach for explicit non-nil initialization specifically at serialization or public-API boundaries.

## See Also

- [mem-slice-preallocate](mem-slice-preallocate.md) - Preallocating also produces a non-nil slice as a side effect
- [type-struct-tags-correctness](type-struct-tags-correctness.md) - JSON tag conventions relevant to this same boundary
- [mem-slice-aliasing-append](mem-slice-aliasing-append.md) - Another slice-semantics subtlety worth internalizing
