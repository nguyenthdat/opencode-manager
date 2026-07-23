# anti-ignore-error

> Don't discard error return values with `_ = err` or a bare ignored call

## Why It Matters

Every discarded error return is a failure path your program pretends can't happen. It compiles fine, passes review if nobody looks closely, and then surfaces as silent data loss or corrupted state far from the actual point of failure - usually discovered by a user or an on-call engineer, not a test.

## Bad

```go
func saveOrder(o Order) {
	data, _ := json.Marshal(o) // discarded: a marshal failure produces a nil/garbage data silently
	os.WriteFile("order.json", data, 0o644) // discarded: write failures vanish entirely
}

func handler(w http.ResponseWriter, r *http.Request) {
	r.ParseForm() // discarded: a malformed form silently leaves r.Form empty/partial
	name := r.FormValue("name")
	process(name)
}
```

## Good

```go
func saveOrder(o Order) error {
	data, err := json.Marshal(o)
	if err != nil {
		return fmt.Errorf("marshal order: %w", err)
	}
	if err := os.WriteFile("order.json", data, 0o644); err != nil {
		return fmt.Errorf("write order: %w", err)
	}
	return nil
}

func handler(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form data", http.StatusBadRequest)
		return
	}
	name := r.FormValue("name")
	process(name)
}
```

## Deliberate, Documented Discards Are Different

```go
// Best-effort telemetry; a failure here must never block the actual request.
_ = metrics.Emit(ctx, "request.count", 1) // explicit discard, with a comment explaining why it's safe
```

An explicit, commented discard at a genuinely low-stakes call site is a deliberate decision, reviewable in code review - it's the silent, unexplained discard on a call that clearly matters (a write, a parse, a close) that this anti-pattern targets.

## See Also

- [err-no-ignore](err-no-ignore.md) - The rule this anti-pattern violates, with more remediation detail
- [lint-errcheck-enabled](lint-errcheck-enabled.md) - The linter that catches this automatically
- [err-check-immediately](err-check-immediately.md) - Checking the error at the point it's produced, instead of discarding it
