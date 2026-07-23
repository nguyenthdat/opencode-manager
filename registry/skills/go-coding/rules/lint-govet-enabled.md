# lint-govet-enabled

> Run `go vet` (directly or via `golangci-lint`) on every build

## Why It Matters

`go vet` is part of the standard toolchain and catches a specific, well-defined set of mistakes the compiler itself doesn't: `Printf`-style format string mismatches, unreachable code, incorrect struct tags, suspicious lock copying, and more. It's fast, has effectively zero false positives, and `go build`/`go test` implicitly run a subset of its checks already - running the full set explicitly catches more.

## Bad

```go
func logUser(u User) {
	fmt.Printf("user: %d\n", u.Name) // %d for a string - go vet catches this, a human reviewer might not
}

type Config struct {
	Retries int `json:retries` // malformed struct tag (missing quotes) - go vet's structtag check flags it
}

func Bad() int {
	return 1
	fmt.Println("never runs") // unreachable code - go vet's unreachable check flags it
}
```

## Good

```sh
go vet ./...
# main.go:8:2: Printf format %d has arg u.Name of wrong type string
# main.go:12:16: struct field tag `json:retries` not compatible with reflect.StructTag.Get: bad syntax for struct tag value
# main.go:18:2: unreachable code
```

Fix each finding, then keep `go vet` in the normal build/test loop:

```sh
go build ./... && go vet ./... && go test ./...
```

## Enabling the Extra `shadow` Check

```yaml
# .golangci.yml - the shadow analyzer isn't in go vet's default set but is
# available through golangci-lint's govet integration
linters-settings:
  govet:
    enable:
      - shadow
```

## `go vet` Is Not Optional in Practice

`go test` runs a subset of `go vet` automatically before executing tests, and will fail the test run if that subset finds an issue - so most projects are already benefiting from part of `go vet` without an explicit step. Running the full `go vet ./...` (or the equivalent via `golangci-lint`) explicitly catches additional checks beyond that automatic subset.

## See Also

- [lint-golangci-lint-config](lint-golangci-lint-config.md) - Running `go vet` alongside other linters through one tool
- [err-nil-check-interface](err-nil-check-interface.md) - One of several bug classes `go vet`/`staticcheck` can catch automatically
- [lint-shadow-check](lint-shadow-check.md) - A deeper look at the shadow-detection check specifically
