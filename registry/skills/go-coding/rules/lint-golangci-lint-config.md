# lint-golangci-lint-config

> Configure `golangci-lint` as the single entry point for all Go linters

## Why It Matters

Running a dozen separate linters (`go vet`, `staticcheck`, `errcheck`, `revive`, `gosec`, ...) individually means separate invocations, separate configuration files, and separate CI steps to maintain. `golangci-lint` runs dozens of linters in parallel through one configuration file and one command, with sensible defaults and a unified output format.

## Bad

```yaml
# CI running each tool separately, with no shared configuration or exclusions:
- run: go vet ./...
- run: staticcheck ./...
- run: errcheck ./...
- run: gosec ./...
# Four separate tools, four separate failure formats, no single place to
# tune severity or exclude a false positive consistently across all of them.
```

## Good

```yaml
# .golangci.yml
version: "2"

linters:
  enable:
    - govet
    - staticcheck
    - errcheck
    - revive
    - gosec
    - unused
    - ineffassign
    - bodyclose
    - sqlclosecheck

issues:
  exclude-dirs:
    - vendor
    - testdata
```

```sh
golangci-lint run ./...
```

## Running in CI

```yaml
# .github/workflows/ci.yml
- uses: golangci/golangci-lint-action@v6
  with:
    version: latest
```

## Tuning Per-Linter Settings

```yaml
linters-settings:
  govet:
    enable:
      - shadow
  revive:
    rules:
      - name: exported
      - name: error-strings
  gosec:
    excludes:
      - G104 # example: excluded with a documented reason, not silently
```

## Rule of Thumb

Start from `golangci-lint`'s reasonable default set, add the linters most relevant to your codebase's risk profile (`gosec` for security-sensitive code, `sqlclosecheck`/`bodyclose` for resource-leak-prone code), and commit `.golangci.yml` to version control so every contributor and CI run uses identical settings.

## See Also

- [lint-govet-enabled](lint-govet-enabled.md) - One of the core linters this configuration enables
- [lint-ci-gating](lint-ci-gating.md) - Wiring this configuration into a CI failure gate
- [lint-staticcheck-enabled](lint-staticcheck-enabled.md) - A deeper look at one of the most valuable linters in the set
