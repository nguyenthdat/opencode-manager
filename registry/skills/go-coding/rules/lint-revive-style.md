# lint-revive-style

> Use `revive` for configurable style and convention checks

## Why It Matters

`revive` is the actively-maintained successor to the now-archived `golint`, and re-implements (plus extends) its style checks - exported-identifier doc comments, error-string conventions, naming conventions - as individually configurable rules, so a team can enable exactly the subset that matches its own style decisions instead of an all-or-nothing linter.

## Bad

```go
// no doc comment at all on an exported function - revive's "exported" rule flags this
func FetchUser(id string) (*User, error) { ... }

func doWork() error {
	return errors.New("Failed to process.") // revive's "error-strings" rule flags capitalization/punctuation
}

var x int // revive can flag a package-level var with an uninformative name, depending on configured rules
```

## Good

```go
// FetchUser retrieves a user by ID.
func FetchUser(id string) (*User, error) { ... }

func doWork() error {
	return errors.New("failed to process")
}
```

## Configuring Which Rules Are Active

```yaml
# .golangci.yml
linters-settings:
  revive:
    rules:
      - name: exported          # require doc comments on exported identifiers
      - name: error-strings      # enforce lowercase, no-punctuation error messages
      - name: var-naming         # enforce initialism casing (ID, URL, ...)
      - name: indent-error-flow  # prefer early-return over an else branch after a return
      - name: unreachable-code
      - name: context-as-argument # require context.Context as the first parameter
```

## Running Standalone (Without `golangci-lint`)

```sh
revive -config revive.toml ./...
```

## `revive` vs. `staticcheck`: Different Focus

`revive` focuses on style and convention (naming, doc comments, idiomatic structure); `staticcheck` focuses on correctness and deprecated-API detection. They overlap only slightly and are commonly run together, each contributing checks the other doesn't perform.

## See Also

- [lint-golangci-lint-config](lint-golangci-lint-config.md) - Enabling `revive` as part of the full lint configuration
- [err-lowercase-msg](err-lowercase-msg.md) - The error-string convention `revive`'s `error-strings` rule enforces
- [doc-comment-starts-with-name](doc-comment-starts-with-name.md) - The doc-comment convention `revive`'s `exported` rule enforces
