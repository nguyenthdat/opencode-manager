# lint-ci-gating

> Fail CI on lint, format, vet, and test failures - don't just report them

## Why It Matters

A linter that only reports issues without blocking the merge is, in practice, optional - and optional checks get ignored under deadline pressure until the codebase has accumulated enough drift that fixing it all at once becomes its own project. Gating CI (failing the build/PR check) on lint, formatting, and test results is what actually keeps a codebase consistent over time.

## Bad

```yaml
# .github/workflows/ci.yml
- run: golangci-lint run ./... || true   # "|| true" swallows the failure - lint issues never block anything
- run: go test ./... || echo "tests failed, continuing anyway"
```

## Good

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.24"

      - name: Format check
        run: |
          unformatted=$(gofmt -l .)
          [ -z "$unformatted" ] || { echo "$unformatted"; exit 1; }

      - name: go vet
        run: go vet ./...

      - name: Lint
        uses: golangci/golangci-lint-action@v6

      - name: Test
        run: go test -race -shuffle=on ./...

      - name: Module tidy check
        run: |
          go mod tidy
          git diff --exit-code go.mod go.sum
```

Any failing step here fails the whole job, which (combined with branch protection rules requiring this check to pass) prevents merging code that doesn't meet the bar.

## Branch Protection Ties It Together

Configure your repository host (GitHub/GitLab) to require this CI job to pass before a pull request can merge - a CI check that can be bypassed isn't actually a gate, just a suggestion.

## Rule of Thumb

Every check worth running is worth failing the build over. If a check is noisy enough that failing the build on it seems unreasonable, that's a signal to tune the check's configuration (exclude a path, disable a specific overly-strict rule), not to stop gating on it.

## See Also

- [lint-golangci-lint-config](lint-golangci-lint-config.md) - The lint configuration this gate runs
- [conc-race-detector-ci](conc-race-detector-ci.md) - Including `-race` specifically in this gated test run
- [proj-module-hygiene](proj-module-hygiene.md) - The `go mod tidy` check included in the gate above
