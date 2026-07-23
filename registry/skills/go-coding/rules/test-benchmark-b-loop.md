# test-benchmark-b-loop

> Write benchmarks with `testing.B`, preferring `b.Loop()` on Go 1.24+

## Why It Matters

Benchmarks measure real performance characteristics instead of guessing, and are the only reliable way to validate that an optimization actually helped. The classic `for i := 0; i < b.N; i++` form is easy to get subtly wrong (timing setup code, letting the compiler eliminate "dead" work); Go 1.24's `b.Loop()` fixes both issues by design.

## Bad

```go
func BenchmarkParse(b *testing.B) {
	data := generateLargeInput() // if this is expensive and placed here, it's fine -
	                              // but forgetting b.ResetTimer() after setup is a common mistake
	for i := 0; i < b.N; i++ {
		Parse(data)
	}
}

func BenchmarkParseWithSetup(b *testing.B) {
	for i := 0; i < b.N; i++ {
		data := generateLargeInput() // BUG: setup cost is now included in every timed iteration
		Parse(data)
	}
}
```

## Good (Classic Form, Correctly Written)

```go
func BenchmarkParse(b *testing.B) {
	data := generateLargeInput() // setup happens once, outside the timed loop
	b.ResetTimer()               // explicitly excludes the setup cost above from the measurement
	for i := 0; i < b.N; i++ {
		Parse(data)
	}
}
```

## Good (Go 1.24+ `b.Loop()`)

```go
func BenchmarkParse(b *testing.B) {
	data := generateLargeInput() // setup runs once; b.Loop() only times the loop body
	for b.Loop() {
		Parse(data)
	}
}
```

`b.Loop()` also keeps the loop body's result live so the compiler can't dead-code-eliminate a call whose return value is unused - a correctness trap the classic `b.N` form required manual care (`b.StopTimer()`/`runtime.KeepAlive`) to avoid.

## Sub-Benchmarks for Comparing Approaches

```go
func BenchmarkJoin(b *testing.B) {
	inputs := generateStrings(1000)

	b.Run("Builder", func(b *testing.B) {
		for b.Loop() {
			var sb strings.Builder
			for _, s := range inputs {
				sb.WriteString(s)
			}
		}
	})

	b.Run("Concat", func(b *testing.B) {
		for b.Loop() {
			result := ""
			for _, s := range inputs {
				result += s
			}
		}
	})
}
```

## See Also

- [mem-benchmark-alloc](mem-benchmark-alloc.md) - Adding allocation reporting to these same benchmarks
- [mem-strings-builder](mem-strings-builder.md) - A typical optimization these benchmarks would validate
- [test-table-driven](test-table-driven.md) - The same table/sub-test structuring style applied to benchmarks
