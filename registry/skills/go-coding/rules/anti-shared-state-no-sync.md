# anti-shared-state-no-sync

> Never access shared mutable state from multiple goroutines without synchronization

## Why It Matters

Reading and writing the same memory location from multiple goroutines without a mutex, atomic operation, or channel handoff is a data race - which in Go (as in most languages without a memory model guarantee for unsynchronized access) is undefined behavior, not just "might occasionally see a stale value." Undefined behavior can mean torn reads, corrupted internal data-structure state, or a crash, and it can appear to work correctly for a long time before failing.

## Bad

```go
type Stats struct {
	requests int
	errors   int
}

var stats Stats // shared, mutable, package-level - and about to be accessed unsynchronized

func handle(w http.ResponseWriter, r *http.Request) {
	stats.requests++ // unsynchronized write from potentially many concurrent goroutines - a data race
	if err := process(r); err != nil {
		stats.errors++ // same problem
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
```

## Good

```go
type Stats struct {
	requests atomic.Int64
	errors   atomic.Int64
}

var stats Stats

func handle(w http.ResponseWriter, r *http.Request) {
	stats.requests.Add(1)
	if err := process(r); err != nil {
		stats.errors.Add(1)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
```

## Or, Protect It With a Mutex if Multiple Fields Must Update Together

```go
type Stats struct {
	mu       sync.Mutex
	requests int
	errors   int
}

func (s *Stats) RecordRequest(failed bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.requests++
	if failed {
		s.errors++
	}
}
```

## Always Verify With `-race`

```sh
go test -race ./...
```

The race detector reliably catches this exact bug class when a test actually exercises the racing code path concurrently - see `conc-race-detector-ci` and `test-race-flag` for making sure your tests do.

## See Also

- [conc-atomic-counters](conc-atomic-counters.md) - The lock-free fix used above for simple counters
- [conc-mutex-minimal-scope](conc-mutex-minimal-scope.md) - The mutex-based fix for state that must update together
- [conc-race-detector-ci](conc-race-detector-ci.md) - Catching this class of bug automatically in CI
