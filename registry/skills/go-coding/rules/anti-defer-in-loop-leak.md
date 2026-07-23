# anti-defer-in-loop-leak

> Don't `defer` a resource release inside a loop body without scoping it per iteration

## Why It Matters

`defer` schedules its call to run when the *enclosing function* returns - not when the current loop iteration ends. Deferring a `Close()`/`Unlock()`/similar cleanup inside a loop that runs many times keeps every one of those resources open simultaneously until the whole function returns, which can exhaust file descriptors, database connections, or held locks long before the function actually finishes.

## Bad

```go
func processAll(paths []string) error {
	for _, p := range paths {
		f, err := os.Open(p)
		if err != nil {
			return err
		}
		defer f.Close() // NOT released until processAll returns - all N files stay open simultaneously

		if err := process(f); err != nil {
			return err
		}
	}
	return nil
}
// Given 10,000 paths, this can exhaust the process's file descriptor limit
// well before processAll finishes, even though each file is only briefly needed.
```

## Good

```go
func processAll(paths []string) error {
	for _, p := range paths {
		if err := processOne(p); err != nil {
			return err
		}
	}
	return nil
}

func processOne(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close() // scoped to THIS call - released as soon as processOne returns, every iteration

	return process(f)
}
```

## Or an Inline Closure, if Extracting a Function Feels Heavy

```go
func processAll(paths []string) error {
	for _, p := range paths {
		if err := func() error {
			f, err := os.Open(p)
			if err != nil {
				return err
			}
			defer f.Close() // scoped to this closure's return, once per iteration
			return process(f)
		}(); err != nil {
			return err
		}
	}
	return nil
}
```

## Detecting This in Review

Look for any `defer` statement whose enclosing block is a `for` loop, not the function itself - that's the pattern to flag. A `defer` at the top level of the function body, even inside an `if`, is fine since it still only fires once.

## See Also

- [mem-defer-loop-cost](mem-defer-loop-cost.md) - The remediation for this exact pattern, in more depth
- [err-no-ignore](err-no-ignore.md) - Handling the deferred `Close()` error correctly once it's properly scoped
- [conc-goroutine-lifecycle](conc-goroutine-lifecycle.md) - A related resource-lifetime discipline for goroutines rather than deferred calls
