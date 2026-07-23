# err-no-ignore

> Never silently discard an error with `_ = err` or a bare ignored return

## Why It Matters

Every discarded error is a failure mode your program pretends doesn't exist. Silent discards turn real problems (a failed write, a closed connection, a broken invariant) into corrupted state or data loss that surfaces much later, far from the actual cause.

## Bad

```go
func saveReport(data []byte) {
	f, _ := os.Create("report.txt") // ignored: what if this fails?
	f.Write(data)                   // ignored: partial write goes unnoticed
	f.Close()                       // ignored: flush errors on close are lost
}

func process() {
	json.Unmarshal(body, &result) // error dropped entirely
	use(result)
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

func process(body []byte) error {
	var result Result
	if err := json.Unmarshal(body, &result); err != nil {
		return fmt.Errorf("unmarshal result: %w", err)
	}
	use(result)
	return nil
}
```

## Handling `Close()` Errors Without Losing the Primary Error

```go
func writeFile(path string, data []byte) (err error) {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer func() {
		if cerr := f.Close(); cerr != nil && err == nil {
			err = fmt.Errorf("close %s: %w", path, cerr)
		}
	}()

	_, err = f.Write(data)
	return err
}
```

## When Discarding Is Legitimate

A small set of cases genuinely don't need the error checked - but discard it explicitly with a comment explaining why, not silently:

```go
// Best-effort cleanup; failure here doesn't affect correctness.
_ = tmpFile.Close()
```

Run `errcheck` (part of `golangci-lint`) in CI to catch unhandled errors automatically.

## See Also

- [err-check-immediately](err-check-immediately.md) - Check the error right after the call that produced it
- [lint-errcheck-enabled](lint-errcheck-enabled.md) - Enforcing this rule automatically in CI
- [anti-ignore-error](anti-ignore-error.md) - The anti-pattern this rule prevents
