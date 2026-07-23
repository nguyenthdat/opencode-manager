# mem-defer-loop-cost

> Avoid `defer` inside tight loops; scope it to a per-iteration function instead

## Why It Matters

`defer` is cheap since Go 1.14's open-coded defers, but every deferred call still accumulates until the *surrounding function* returns - not the loop iteration. `defer`-ing a resource release inside a loop that runs thousands of times keeps every one of those resources open simultaneously until the function exits, which can exhaust file descriptors or hold locks far longer than intended, independent of the per-call defer overhead.

## Bad

```go
func mergeFiles(paths []string) error {
	var out []byte
	for _, p := range paths {
		f, err := os.Open(p)
		if err != nil {
			return err
		}
		defer f.Close() // all N files stay open until mergeFiles returns, not per-iteration

		data, err := io.ReadAll(f)
		if err != nil {
			return err
		}
		out = append(out, data...)
	}
	return os.WriteFile("merged.txt", out, 0o644)
}
```

## Good

```go
func mergeFiles(paths []string) error {
	var out []byte
	for _, p := range paths {
		if err := func() error {
			f, err := os.Open(p)
			if err != nil {
				return err
			}
			defer f.Close() // closes at the end of THIS iteration's function scope

			data, err := io.ReadAll(f)
			if err != nil {
				return err
			}
			out = append(out, data...)
			return nil
		}(); err != nil {
			return err
		}
	}
	return os.WriteFile("merged.txt", out, 0o644)
}
```

## Or Extract a Named Helper (Usually Clearer)

```go
func readFile(path string) ([]byte, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close() // scoped to this function call, released every iteration
	return io.ReadAll(f)
}

func mergeFiles(paths []string) error {
	var out []byte
	for _, p := range paths {
		data, err := readFile(p)
		if err != nil {
			return err
		}
		out = append(out, data...)
	}
	return os.WriteFile("merged.txt", out, 0o644)
}
```

## Rule of Thumb

`defer` inside a loop body is a correctness/resource-lifetime concern first, and only secondarily a performance concern. Scope any `defer`-based cleanup to a function that returns once per iteration (an extracted helper or an inline closure), so resources are released promptly rather than piling up for the whole loop's duration.

## See Also

- [anti-defer-in-loop-leak](anti-defer-in-loop-leak.md) - The anti-pattern this rule directly addresses
- [mem-buffered-io](mem-buffered-io.md) - Related I/O resource handling
- [err-no-ignore](err-no-ignore.md) - Handling the close error from a deferred `Close()` correctly
