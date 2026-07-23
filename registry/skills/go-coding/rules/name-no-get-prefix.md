# name-no-get-prefix

> Don't prefix simple accessors with `Get`

## Why It Matters

Go convention omits the `Get` prefix for simple field accessors - `Name()`, not `GetName()`. This differs from Java/C# convention, but is consistent across the Go standard library and virtually every idiomatic Go codebase. Reserve a verb like `Get`/`Fetch`/`Load` for methods that actually do meaningful work (a network call, a computation), not a plain field read.

## Bad

```go
type User struct {
	name string
	age  int
}

func (u *User) GetName() string { return u.name }
func (u *User) GetAge() int     { return u.age }
```

## Good

```go
type User struct {
	name string
	age  int
}

func (u *User) Name() string { return u.name }
func (u *User) Age() int     { return u.age }
```

## Setters Do Keep an Explicit Verb

```go
func (u *User) SetName(name string) { u.name = name } // setters are named Set..., unlike getters
```

## When a Verb Prefix Is Appropriate

```go
// These do real work beyond a plain field read - a verb makes that clear:
func (c *Client) FetchUser(ctx context.Context, id string) (*User, error) { /* network call */ return nil, nil }
func (s *Store) LoadConfig(path string) (*Config, error)                  { /* file I/O */ return nil, nil }
func (c *Cache) GetOrCompute(key string, fn func() int) int               { /* Get is fine here: it's a distinct, named operation, not a bare accessor */ return 0 }
```

## Standard Library Precedent

```go
req.URL.Query()      // not GetQuery()
resp.StatusCode      // a field, not even a method
file.Name()          // not GetName()
err.Error()          // not GetError() or GetMessage()
```

## See Also

- [name-boolean-prefix](name-boolean-prefix.md) - The equivalent naming convention for boolean accessors
- [struct-unexported-fields-encapsulation](struct-unexported-fields-encapsulation.md) - Why you'd write an accessor method in the first place
- [name-mixedcaps](name-mixedcaps.md) - The broader identifier casing convention this rule specializes
