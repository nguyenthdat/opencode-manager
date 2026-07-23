# perf-profile-instruments

> Profile with Instruments before optimizing

## Why It Matters

Intuitions about what's "slow" in Swift are frequently wrong—ARC retain/release traffic, bridging, and allocation patterns often dominate over the things engineers instinctively suspect (algorithmic complexity, a specific loop). Instruments' Time Profiler, Allocations, and SwiftUI-specific templates give ground truth about where time and memory actually go, so optimization effort lands on the real bottleneck instead of a guess.

## Bad

```swift
// "This feels slow, let me optimize everything I can think of":
// - Switched Array to ContiguousArray everywhere (no measured benefit)
// - Added @inline(__always) to a dozen functions (no measured benefit)
// - Rewrote a readable filter().first as first(where:) in a function
//   that runs once per app launch (immaterial; readability lost for nothing)
//
// None of this was informed by where the actual time was going, and the
// real bottleneck (a synchronous JSON decode of a 50 MB file on the main
// thread) was never found or fixed.
func loadDashboard() {
    let data = try! Data(contentsOf: dashboardCacheURL) // <- actual bottleneck
    let model = try! JSONDecoder().decode(Dashboard.self, from: data)
    render(model)
}
```

## Good

```swift
// 1. Profile first: run the app under Instruments' Time Profiler while
//    reproducing the slow interaction. The call tree shows
//    JSONDecoder.decode(_:from:) consuming 80% of wall-clock time.
// 2. Fix the actual bottleneck the profile identified:
func loadDashboard() async throws {
    let data = try await Task.detached(priority: .userInitiated) {
        try Data(contentsOf: dashboardCacheURL)
    }.value
    let model = try JSONDecoder().decode(Dashboard.self, from: data)
    await MainActor.run { render(model) }
}
// 3. Re-profile to confirm the fix actually moved the needle.
```

## Instruments Templates Worth Knowing

```swift
// Time Profiler       - CPU time by call stack; find hot functions.
// Allocations          - Heap growth, retain/release churn, leaks.
// SwiftUI              - Body re-evaluation counts; find over-rendering views.
// Core Animation       - Frame rate / dropped frames for UI-bound issues.
// os_signpost           - Custom, low-overhead markers for your own phases:
import os

let log = OSLog(subsystem: "com.example.app", category: "Dashboard")

func loadDashboard() async throws {
    os_signpost(.begin, log: log, name: "LoadDashboard")
    defer { os_signpost(.end, log: log, name: "LoadDashboard") }
    // ...
}
```

## See Also

- [`perf-inline-hot-path`](perf-inline-hot-path.md) - Applying inlining only after profiling confirms it
- [`anti-premature-optimization-swift`](anti-premature-optimization-swift.md) - Avoiding unmeasured optimization
- [`perf-value-type-copy-cost`](perf-value-type-copy-cost.md) - A common thing profiling reveals as a cost
