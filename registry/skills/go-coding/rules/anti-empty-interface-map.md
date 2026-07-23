# anti-empty-interface-map

> Don't use `map[string]any` as a substitute for a real, typed struct

## Why It Matters

`map[string]any` (or `map[string]interface{}`) gives up every compile-time guarantee a struct would provide - no field name checking, no type checking, and every access requires a runtime type assertion that can panic or silently fail. It's tempting as a quick way to handle "flexible" data, but it pushes all the validation and safety work that a struct definition would give you for free onto every single call site instead.

## Bad

```go
func createUser(data map[string]any) error {
	name, ok := data["name"].(string) // easy to typo the key, easy to get the type assertion wrong
	if !ok {
		return errors.New("name must be a string")
	}
	age, ok := data["age"].(int) // silently wrong if age arrived as a float64 from JSON decoding!
	if !ok {
		return errors.New("age must be an int")
	}
	// every caller of createUser has to know the exact shape of "data" by convention only
	return save(name, age)
}

createUser(map[string]any{"nmae": "Alice", "age": 30}) // typo "nmae" compiles fine, fails only at runtime
```

## Good

```go
type CreateUserRequest struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func createUser(req CreateUserRequest) error {
	if req.Name == "" {
		return errors.New("name is required")
	}
	return save(req.Name, req.Age)
}

// A typo in a field name is now a compile error, not a silent runtime bug:
createUser(CreateUserRequest{Name: "Alice", Age: 30})
```

## JSON Decoding Directly Into the Typed Struct

```go
var req CreateUserRequest
if err := json.NewDecoder(r.Body).Decode(&req); err != nil { // struct tags handle the field mapping automatically
	http.Error(w, "invalid request", http.StatusBadRequest)
	return
}
```

This also sidesteps the classic `map[string]any` + `encoding/json` trap where every JSON number decodes as `float64`, not `int` - a struct with typed fields avoids that entire class of assertion bug.

## When `map[string]any` Is Legitimate

For genuinely dynamic, schema-less data (arbitrary user-supplied metadata, a generic JSON-passthrough proxy that never inspects the payload's fields), a map is the right tool - the anti-pattern is reaching for it as a shortcut when the shape of the data is actually known and stable.

## See Also

- [api-avoid-any-overuse](api-avoid-any-overuse.md) - The broader principle this anti-pattern is a specific instance of
- [type-struct-tags-correctness](type-struct-tags-correctness.md) - Defining the typed struct's JSON tags correctly
- [api-table-driven-config](api-table-driven-config.md) - Structs as the general alternative to loosely-typed parameter bags
