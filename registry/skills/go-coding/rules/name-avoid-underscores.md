# name-avoid-underscores

> Never use underscores within Go identifiers (types, funcs, vars, fields)

## Why It Matters

Go's naming convention is `MixedCaps`, not `snake_case`. Underscores inside identifiers are reserved, by convention, for a small set of specific purposes - test/benchmark file suffixes and build-constraint file names - not for ordinary multi-word identifiers. Mixing conventions makes a codebase feel inconsistent and immediately signals code that wasn't written idiomatically for Go.

## Bad

```go
var max_retries = 3
var user_name string

type http_client struct {
	base_url string
}

func send_request(url_str string) error { return nil }
```

## Good

```go
var maxRetries = 3
var userName string

type httpClient struct {
	baseURL string
}

func sendRequest(urlStr string) error { return nil }
```

## Where Underscores Are Legitimately Part of Go Convention

```go
user_test.go        // test file suffix - required by `go test`
foo_linux.go         // GOOS build constraint suffix - required by the build system
foo_amd64_test.go     // combined GOOS/arch/test suffix

func TestUser_InvalidEmail(t *testing.T) {} // common convention: underscore separates
                                              // the function under test from the scenario
```

## The Blank Identifier Is a Different Concept Entirely

```go
_, err := doSomething() // `_` discards a value; this isn't a naming convention issue,
if err != nil {          // it's the language's dedicated "I don't need this" syntax
	return err
}
```

## See Also

- [name-mixedcaps](name-mixedcaps.md) - The positive convention this rule is the negative restatement of
- [test-descriptive-names](test-descriptive-names.md) - Where underscore-separated test function names are idiomatic
- [lint-golangci-lint-config](lint-golangci-lint-config.md) - Linting setup that flags non-conforming identifiers
