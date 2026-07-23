# mem-sync-pool-reuse

> Use `sync.Pool` to reuse short-lived, expensive-to-allocate buffers

## Why It Matters

Allocating and immediately discarding large buffers (e.g., for JSON encoding, compression, or request scratch space) on every call pressures the garbage collector. `sync.Pool` provides a concurrency-safe pool of reusable objects that the runtime can also shrink automatically under memory pressure, cutting allocation churn on hot paths.

## Bad

```go
func handleRequest(w http.ResponseWriter, data any) error {
	buf := new(bytes.Buffer) // fresh allocation on every single request
	if err := json.NewEncoder(buf).Encode(data); err != nil {
		return err
	}
	_, err := w.Write(buf.Bytes())
	return err
}
```

## Good

```go
var bufPool = sync.Pool{
	New: func() any {
		return new(bytes.Buffer)
	},
}

func handleRequest(w http.ResponseWriter, data any) error {
	buf := bufPool.Get().(*bytes.Buffer)
	buf.Reset() // always reset before reuse - it may hold data from a previous user
	defer bufPool.Put(buf)

	if err := json.NewEncoder(buf).Encode(data); err != nil {
		return err
	}
	_, err := w.Write(buf.Bytes())
	return err
}
```

## Rules for Using `sync.Pool` Correctly

- Always `Reset()` (or otherwise clear) the object after `Get` and before use - the pool does not do this for you.
- Never assume an object obtained from `Get` retains state from a specific prior `Put`; pooled objects can come from any goroutine.
- Don't store objects with pointers to short-lived, request-specific data across pool boundaries in a way that leaks that data to the next user.
- `sync.Pool` is for reducing GC pressure on short-lived allocations under load, not a general-purpose object cache with guaranteed retention - the runtime is free to evict pooled items, notably around GC cycles.

## When Not to Bother

For infrequently-called code paths, or when profiling doesn't show allocation from this call site as a bottleneck, the added complexity of pool management isn't worth it. Reach for `sync.Pool` after `pprof` identifies real allocation pressure, not preemptively.

## See Also

- [mem-buffered-io](mem-buffered-io.md) - Related buffer reuse for I/O
- [mem-benchmark-alloc](mem-benchmark-alloc.md) - Measuring the allocation reduction this rule provides
- [http-request-body-limit](http-request-body-limit.md) - Another request-scoped resource-management concern
