# lint-errcheck-enabled

> Enable `errcheck` to catch every unhandled error return value

## Why It Matters

Go's compiler does not require an error return value to be checked, assigned, or even acknowledged - `f()` compiles identically whether or not `f` returns an error you silently ignore. `errcheck` is a static analyzer built specifically to close this gap, flagging every call whose error return is dropped, so silent failures can't slip through code review unnoticed.

## Bad

```go
func saveReport(data []byte) {
	f, _ := os.Create("report.txt") // ignored - errcheck flags this
	f.Write(data)                   // ignored - errcheck flags this too
	f.Close()                       // ignored - errcheck flags this as well
}
```

## Good

```go
func saveReport(data []byte) error {
	f, err := os.Create("report.txt")
	if err != nil {
		return fmt.Errorf("create report: %w", err)
	}
	defer f.Close()

	if _, err := f.Write(data); err != nil {
		return fmt.Errorf("write report: %w", err)
	}
	return nil
}
```

```sh
errcheck ./...
# report.go:3:26: os.Create("report.txt")
# report.go:4:4: f.Write(data)
# report.go:5:4: f.Close()
```

## Explicitly Discarding an Error (When Genuinely Fine)

```go
// errcheck respects an explicit blank-identifier discard as an acknowledgment,
// though it's best practice to comment WHY it's safe to ignore here:
_ = tmpFile.Close() // best-effort cleanup; failure doesn't affect correctness
```

## Configuring Exclusions

```yaml
# .golangci.yml
linters-settings:
  errcheck:
    exclude-functions:
      - (*os.File).Close  # example: excluding a specific known-safe-to-ignore call pattern,
                          # scoped narrowly rather than disabling errcheck entirely
```

Prefer narrow, explicit exclusions over disabling `errcheck` broadly - the whole point of the linter is that "this one doesn't matter" should be a deliberate, reviewed decision, not the default.

## See Also

- [err-no-ignore](err-no-ignore.md) - The underlying discipline this linter enforces automatically
- [lint-golangci-lint-config](lint-golangci-lint-config.md) - Running `errcheck` as part of the full lint suite
- [err-check-immediately](err-check-immediately.md) - Handling the error correctly once `errcheck` flags it
