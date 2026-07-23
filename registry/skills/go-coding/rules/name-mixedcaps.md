# name-mixedcaps

> Use `MixedCaps`/`mixedCaps`, never underscores, for multi-word identifiers

## Why It Matters

Go's naming convention is `MixedCaps` for exported identifiers and `mixedCaps` for unexported ones - never `snake_case` or `SCREAMING_SNAKE_CASE` (except for a small set of build-tag-like conventions in file names). This is enforced by community convention and `gofmt`/`golint`/`revive` tooling, and deviating from it is one of the fastest ways to signal non-idiomatic Go to any reviewer.

## Bad

```go
type user_account struct {
	first_name string
	last_name  string
	is_active  bool
}

func get_user_by_id(user_id string) (*user_account, error) {
	// ...
	return nil, nil
}

const MAX_RETRY_COUNT = 3
```

## Good

```go
type UserAccount struct {
	FirstName string
	LastName  string
	IsActive  bool
}

func GetUserByID(userID string) (*UserAccount, error) {
	// ...
	return nil, nil
}

const MaxRetryCount = 3
```

## Exported vs. Unexported

```go
type Config struct { // exported type: UpperCamelCase
	Timeout time.Duration // exported field: UpperCamelCase
	retries int           // unexported field: lowerCamelCase
}

func NewConfig() *Config { /* exported func: UpperCamelCase */ return &Config{} }

func validate(c *Config) error { /* unexported func: lowerCamelCase */ return nil }
```

## The One Place Underscores Are Idiomatic

Test, benchmark, and example file names use underscores as part of Go's build/test file conventions (`user_test.go`, `foo_linux.go`), and blank identifiers (`_`) are used to discard values - neither of those is what this rule is about; it applies to identifier names (types, funcs, vars, fields) within code.

## See Also

- [name-avoid-underscores](name-avoid-underscores.md) - The narrower rule specifically about avoiding underscores in identifiers
- [name-initialisms](name-initialisms.md) - How acronyms fit into MixedCaps (`UserID`, not `UserId` or `User_ID`)
- [lint-revive-style](lint-revive-style.md) - Linter that enforces this convention automatically
