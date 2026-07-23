# type-struct-tags-correctness

> Write struct tags with correct syntax and the options you actually intend

## Why It Matters

Struct tags are plain strings parsed at runtime via reflection - a typo (missing comma, wrong key name, mismatched quotes) doesn't fail to compile, it silently fails to apply, and the bug surfaces only when a field mysteriously doesn't (de)serialize the way you expected.

## Bad

```go
type User struct {
	ID        string `json: "id"`               // space after colon breaks parsing silently
	Name      string `json:"name,omitEmpty"`     // wrong case: should be "omitempty"
	Password  string `json:"password"`           // sensitive field with no omission at all
	CreatedAt time.Time `json:"created_at" db:"created_at`  // missing closing quote on db tag
}
```

## Good

```go
type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name,omitempty"`
	Password  string    `json:"-"`                    // never serialize this field
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
```

## Common `encoding/json` Tag Options

```go
type Config struct {
	Name     string `json:"name"`
	Optional string `json:"optional,omitempty"` // omit from output if zero value
	Hidden   string `json:"-"`                   // never marshal/unmarshal this field
	Renamed  string `json:"custom_name"`         // use a different key than the field name
}
```

## Verifying Tags Compile-Correctly

`go vet` includes a `structtag` check that catches malformed tag syntax (unbalanced quotes, missing colons) at build time:

```sh
go vet ./...
# example failure:
# struct field tag `json: "id"` not compatible with reflect.StructTag.Get: bad syntax for struct tag key
```

`go vet` cannot catch semantic mistakes like `omitEmpty` (wrong case) versus `omitempty` (correct) - that requires careful review or a round-trip test.

## Round-Trip Testing Tags

```go
func TestUserJSON(t *testing.T) {
	u := User{ID: "1", Name: "Alice"}
	data, err := json.Marshal(u)
	if err != nil {
		t.Fatal(err)
	}
	var got User
	if err := json.Unmarshal(data, &got); err != nil {
		t.Fatal(err)
	}
	if got != u {
		t.Errorf("round-trip mismatch: got %+v, want %+v", got, u)
	}
}
```

## See Also

- [struct-tags-json-omitempty](struct-tags-json-omitempty.md) - Deeper guidance on `omitempty` semantics and pitfalls
- [mem-nil-slice-vs-empty](mem-nil-slice-vs-empty.md) - A related JSON-serialization subtlety
- [lint-govet-enabled](lint-govet-enabled.md) - Enabling the `structtag` vet check in CI
