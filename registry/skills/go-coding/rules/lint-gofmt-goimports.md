# lint-gofmt-goimports

> Run `gofmt`/`goimports` on save and gate CI on formatted code

## Why It Matters

Go ships with an opinionated, non-configurable formatter (`gofmt`), which eliminates an entire category of code-review debate ("tabs vs. spaces," brace placement) by making formatting a solved, automated problem. `goimports` extends this by also managing import grouping/sorting and adding/removing imports as needed. Unformatted code committed to a repository is a solvable problem that should never reach review.

## Bad

```go
func process(name string,age int)( string,error) {
    if age<0{
    return "",errors.New("invalid age")
    }
	return    fmt.Sprintf("%s is %d",name,age),nil
}
// Inconsistent spacing, indentation, and brace style - none of this should
// ever be a human's problem to fix by hand.
```

## Good

```go
func process(name string, age int) (string, error) {
	if age < 0 {
		return "", errors.New("invalid age")
	}
	return fmt.Sprintf("%s is %d", name, age), nil
}
```

```sh
gofmt -l .          # lists files that are not correctly formatted
gofmt -w .          # rewrites files in place to match gofmt's formatting
goimports -w .      # gofmt, plus automatically adds/removes/sorts imports
```

## Gating CI on Formatting

```yaml
# .github/workflows/ci.yml
- name: Check formatting
  run: |
    unformatted=$(gofmt -l .)
    if [ -n "$unformatted" ]; then
      echo "The following files are not gofmt'ed:"
      echo "$unformatted"
      exit 1
    fi
```

## Editor Integration

Configure your editor to run `goimports` (or `gofmt`) automatically on save - most Go-aware editors (VS Code's Go extension, GoLand, vim-go) support this out of the box, which means formatting is never something a human needs to think about during normal development.

## Import Grouping Convention

```go
import (
	"context" // 1. standard library
	"fmt"

	"github.com/google/uuid" // 2. third-party
	"golang.org/x/sync/errgroup"

	"example.com/myproject/internal/store" // 3. this module's own packages
)
```

`goimports` maintains this grouping automatically; don't hand-maintain import ordering.

## See Also

- [lint-golangci-lint-config](lint-golangci-lint-config.md) - Running a `gofmt`/`goimports` check alongside other linters
- [lint-ci-gating](lint-ci-gating.md) - Failing CI on unformatted code, as shown above
- [name-mixedcaps](name-mixedcaps.md) - Naming conventions `gofmt` does not (and cannot) enforce on its own
