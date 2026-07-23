# lint-unused-detection

> Enable `unused`/`deadcode` checks to catch dead code and unused identifiers

## Why It Matters

Unused package-level functions, types, constants, and struct fields accumulate silently over time as features are removed or refactored, bloating the codebase and confusing readers who assume something unused must still matter somewhere. The `unused` linter (bundled in `staticcheck`'s toolset and enabled by default in `golangci-lint`) performs whole-program analysis to find identifiers that are truly never referenced.

## Bad

```go
package billing

// No longer called anywhere after a refactor two releases ago, but nobody removed it.
func calculateLegacyDiscount(price float64) float64 {
	return price * 0.9
}

type unusedConfig struct { // never constructed or referenced anywhere
	Timeout time.Duration
}

const maxRetriesOld = 5 // superseded by maxRetries, never removed
```

## Good

```go
package billing

// calculateLegacyDiscount and unusedConfig removed entirely once confirmed
// unreferenced; version control history preserves them if ever needed again.

const maxRetries = 5
```

```sh
golangci-lint run --enable=unused ./...
# billing.go:5:6: func calculateLegacyDiscount is unused (unused)
# billing.go:10:6: type unusedConfig is unused (unused)
# billing.go:14:7: const maxRetriesOld is unused (unused)
```

## Exported Identifiers Are a Blind Spot

`unused` can only reliably detect dead code for unexported identifiers within a single build - an exported function might be unused *within this module* but still be part of a public API that external consumers depend on. For libraries, cross-reference exported-but-seemingly-unused identifiers against your actual API contract (and `doc-deprecated-comment` conventions) before removing them; for `internal/`-only or `main`-package code, `unused` findings on exported names are much more trustworthy.

## Fields vs. Whole Types

```go
type Config struct {
	Timeout time.Duration
	retries int // unexported field, never read anywhere - unused's fieldunused check (if enabled) flags this
}
```

Some struct-field-level unused detection requires additional analyzers (`fieldalignment`'s sibling checks or dedicated tools) beyond the base `unused` linter - review struct fields manually as part of routine code review too.

## See Also

- [lint-golangci-lint-config](lint-golangci-lint-config.md) - Enabling `unused` as part of the broader lint suite
- [api-minimal-exported-surface](api-minimal-exported-surface.md) - Keeping the exported surface small so `unused` findings are more trustworthy
- [proj-internal-packages](proj-internal-packages.md) - `internal/` code is the safest target for aggressive dead-code removal
