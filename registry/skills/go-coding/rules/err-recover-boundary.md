# err-recover-boundary

> Recover panics only at a well-defined boundary (goroutine root, HTTP middleware)

## Why It Matters

`recover` stops a panic from crashing the process, but calling it deep inside business logic hides bugs and leaves the program in an unknown state. The idiomatic place to `recover` is at the outermost boundary of a unit of work - the top of a spawned goroutine, or HTTP middleware - where you can log the panic, return a clean error/response, and stop propagation without masking the original defect.

## Bad

```go
func processItem(item Item) (result Result, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("recovered: %v", r) // swallows bugs deep in normal logic
		}
	}()
	return doWork(item), nil
}
```

## Good

```go
// Goroutine boundary: an unhandled panic in a spawned goroutine crashes the
// whole process, so recover here, log it, and report failure through the
// normal error channel.
func worker(jobs <-chan Job, results chan<- Result) {
	for job := range jobs {
		results <- safeRun(job)
	}
}

func safeRun(job Job) (res Result) {
	defer func() {
		if r := recover(); r != nil {
			res = Result{Err: fmt.Errorf("job %s panicked: %v", job.ID, r)}
		}
	}()
	return runJob(job)
}
```

## HTTP Middleware Boundary

```go
func RecoverMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("panic handling %s %s: %v\n%s", r.Method, r.URL.Path, rec, debug.Stack())
				http.Error(w, "internal server error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
```

## Rules for the Boundary

- Log the stack trace (`runtime/debug.Stack()`) so the underlying bug is still visible.
- Never recover and silently continue as if nothing happened - always surface a failure signal.
- Don't scatter `recover()` calls through business logic; one boundary per goroutine/request is enough.

## See Also

- [err-panic-programmer-bugs](err-panic-programmer-bugs.md) - What should panic in the first place
- [conc-goroutine-lifecycle](conc-goroutine-lifecycle.md) - Managing goroutines that need this boundary
- [http-graceful-shutdown](http-graceful-shutdown.md) - Related server-lifecycle boundary concerns
