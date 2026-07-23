# lint-staticcheck-enabled

> Enable `staticcheck` for deep static analysis beyond `go vet`

## Why It Matters

`staticcheck` implements a much larger set of checks than `go vet` - dead code detection, deprecated API usage, inefficient patterns, common correctness bugs (like the nil-interface pitfall), and style issues - each with a stable check ID (`SA1019`, `ST1016`, etc.) that can be individually enabled, disabled, or looked up for explanation.

## Bad

```go
// Deprecated API used without any warning surfaced during review:
user, err := FetchUser("1") // FetchUser is marked `// Deprecated: use FetchUserV2`

// Dead code that never affects behavior:
func compute(x int) int {
	result := x * 2
	result = x * 3 // SA4006: this value of result is never used
	return result
}

// Inconsistent receiver names across a type's methods (see name-receiver-consistency):
func (c *Cache) Get(k string) string { return c.data[k] }
func (cache *Cache) Set(k, v string) { cache.data[k] = v } // ST1016
```

## Good

```sh
staticcheck ./...
# main.go:4:2: SA1019: FetchUser is deprecated: use FetchUserV2 instead
# main.go:10:2: SA4006: this value of result is never used
# main.go:16:1: ST1016: methods on the same type should have the same receiver name
```

Fix each finding, then wire `staticcheck` into `golangci-lint` (it's included by default) or run it directly in CI.

## A Few High-Value Checks Worth Knowing

| Check | What it catches |
|---|---|
| `SA1019` | Use of a deprecated identifier |
| `SA4006` | A value assigned but never used before being overwritten |
| `SA4023` | A comparison that's always true/false due to the nil-interface pitfall |
| `SA5000` | Nil map assignment that would panic |
| `ST1005` | Error strings that start with a capital letter or end in punctuation |
| `S1000`-`S1039` | Simplification suggestions (idiomatic rewrites) |

## Selectively Disabling a Check

```yaml
# .golangci.yml
linters-settings:
  staticcheck:
    checks:
      - all
      - -ST1000 # example: disabling a specific stylistic check project-wide, if it conflicts with local convention
```

## See Also

- [lint-golangci-lint-config](lint-golangci-lint-config.md) - Running `staticcheck` alongside the rest of the lint suite
- [err-nil-check-interface](err-nil-check-interface.md) - The nil-interface bug `SA4023` specifically detects
- [doc-deprecated-comment](doc-deprecated-comment.md) - The `Deprecated:` comment convention `SA1019` enforces
