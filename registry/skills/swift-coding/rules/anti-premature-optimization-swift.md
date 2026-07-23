# anti-premature-optimization-swift

> Don't optimize before profiling

## Why It Matters

Optimizing code before measuring where time is actually spent almost always targets the wrong thing: developer intuition about hot paths is frequently wrong, and "optimizations" applied speculatively (manual memory pooling, `@inline(__always)` sprinkled everywhere, replacing `Array` with `ContiguousArray` throughout a codebase) add real complexity and readability cost for a performance benefit that may not exist, while the actual bottleneck — often a single N+1 network call pattern or an accidental O(n²) loop — goes unmeasured and unfixed.

## Bad

```swift
// "Optimized" before ever profiling — added complexity, no measured benefit
struct ImageCache {
    // Manually pooled buffers "for performance," never benchmarked against the simple version.
    private var bufferPool: [UnsafeMutableRawPointer] = []

    @inline(__always)
    func lookup(_ key: String) -> UIImage? {
        // hand-rolled hashing "to avoid Dictionary overhead" — never profiled against Dictionary
        let hash = key.utf8.reduce(0) { ($0 << 5) &+ $0 &+ Int($1) }
        // ...
    }
}
// Meanwhile, the actual measured bottleneck (elsewhere) is a synchronous
// N+1 network call pattern nobody looked at, because effort went here instead.
```

## Good

```swift
// Start simple, correct, and readable.
struct ImageCache {
    private var storage: [String: UIImage] = [:]

    func lookup(_ key: String) -> UIImage? {
        storage[key]
    }
}

// Profile with Instruments (Time Profiler / Allocations) under realistic load.
// If ImageCache.lookup genuinely shows up as a hot path with measured impact,
// optimize *that* specific, profiled bottleneck — and re-measure to confirm the win.
```

## The Right Order of Operations

1. Write the simple, correct version first.
2. Profile under realistic load with Instruments (Time Profiler, Allocations, Leaks) to find the actual bottleneck.
3. Optimize only the measured hot path, with a benchmark proving the change helps.
4. Re-profile to confirm the fix actually moved the needle, and keep the benchmark around to guard against regression.

```swift
// A benchmark, not a guess — proves the optimization actually helped:
func testImageCacheLookupPerformance() {
    measure {
        for _ in 0..<10_000 { _ = cache.lookup("key-42") }
    }
}
```

## See Also

- [`perf-profile-instruments`](perf-profile-instruments.md) - the profiling step this rule requires before optimizing
- [`perf-inline-hot-path`](perf-inline-hot-path.md) - the correct, narrow scope for `@inline`/`@inlinable` once profiled
- [`proj-flat-small-package`](proj-flat-small-package.md) - the same "wait for real evidence" principle applied to structure
