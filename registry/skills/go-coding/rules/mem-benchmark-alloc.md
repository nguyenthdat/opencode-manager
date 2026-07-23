# mem-benchmark-alloc

> Use `testing.B` with `-benchmem`/`b.ReportAllocs()` to track allocations

## Why It Matters

Wall-clock time alone doesn't tell you *why* a function is slow, and it's easy to introduce an allocation regression that doesn't show up until the garbage collector starts working harder under production load. Benchmarking with allocation reporting turns "I think this allocates less" into a verified, trackable number you can compare across changes and gate in CI.

## Bad

```go
func BenchmarkParse(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Parse(input) // no visibility into allocations, only wall-clock time
	}
}
```

## Good

```go
func BenchmarkParse(b *testing.B) {
	b.ReportAllocs() // adds allocs/op and B/op to the output
	for i := 0; i < b.N; i++ {
		Parse(input)
	}
}
```

Run with:

```sh
go test -bench=BenchmarkParse -benchmem ./...
```

```
BenchmarkParse-8    2000000    650 ns/op    128 B/op    3 allocs/op
```

## Go 1.24's `b.Loop()`

```go
func BenchmarkParse(b *testing.B) {
	for b.Loop() { // Go 1.24+: replaces the manual `for i := 0; i < b.N; i++` form,
		Parse(input) // and keeps setup code (like `input` here) outside the timed loop automatically
	}
}
```

`b.Loop()` also prevents the compiler from optimizing away the loop body's result when it has no observable side effect, which the old `b.N` form could sometimes fail to prevent without `b.StopTimer()`/dummy variables.

## Comparing Before/After With `benchstat`

```sh
go test -bench=. -benchmem -count=10 ./... > old.txt
# make your change
go test -bench=. -benchmem -count=10 ./... > new.txt
benchstat old.txt new.txt
```

`benchstat` reports whether a difference in `ns/op` or `allocs/op` is statistically significant, avoiding false conclusions from single noisy runs.

## Gating Regressions in CI

Track `allocs/op` for hot-path benchmarks over time; a sudden jump (e.g., from 1 to 5 allocations) is often a more reliable regression signal than `ns/op`, which is noisier on shared CI hardware.

## See Also

- [test-benchmark-b-loop](test-benchmark-b-loop.md) - Writing the benchmark functions this rule measures
- [mem-sync-pool-reuse](mem-sync-pool-reuse.md) - A common target for allocation-reduction benchmarking
- [mem-slice-preallocate](mem-slice-preallocate.md) - A change whose effect is best confirmed with `-benchmem`
