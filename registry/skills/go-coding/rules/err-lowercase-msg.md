# err-lowercase-msg

> Error messages: lowercase, no trailing punctuation

## Why It Matters

Error strings are frequently wrapped and concatenated by callers (`fmt.Errorf("op: %w", err)`), producing chains like `"handler: db query: connection refused"`. Capital letters or trailing periods in the middle of that chain look wrong and break the convention every Go developer expects, per Go's own style guide (`golint`/`revive`'s `error-strings` check).

## Bad

```go
return errors.New("Failed to connect to database.")
return fmt.Errorf("Could not read file: %w", err)
return errors.New("Invalid input!")

// Produces awkward chains:
// "process request: Failed to connect to database."
```

## Good

```go
return errors.New("failed to connect to database")
return fmt.Errorf("read file: %w", err)
return errors.New("invalid input")

// Chains read naturally:
// "process request: connect to database: connection refused"
```

## Style Guidelines

- Start with a lowercase letter (unless it begins with an exported name or acronym: `"URL missing scheme"` is fine).
- No trailing period, exclamation point, or newline.
- Prefer a short noun phrase describing the failed operation (`"read file"`) over a full sentence (`"could not read the file"`) - it composes better when wrapped.
- Don't include the package name inside every error string; the call site and wrapping context usually make it obvious.

## Enforcing With Lint

```yaml
# .golangci.yml
linters:
  enable:
    - revive
linters-settings:
  revive:
    rules:
      - name: error-strings
```

## See Also

- [err-wrap-fmt-w](err-wrap-fmt-w.md) - How these messages get composed into chains
- [err-sentinel-var](err-sentinel-var.md) - Sentinel error message conventions
- [lint-revive-style](lint-revive-style.md) - Linter that enforces this convention
