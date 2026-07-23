# perf-profile-instruments-first

> Profile with Instruments before optimizing

## Why It Matters

Intuition about where Objective-C code is slow is frequently wrong: developers often optimize an obviously-expensive-looking `stringWithFormat:` call while the real cost is an unbatched Core Data fetch or a retain/release storm from a compiler-inserted ARC call. Instruments' Time Profiler, Allocations, and Leaks templates show exactly where wall-clock time and memory actually go, turning guesswork into measurement.

## Bad

```objc
// "This NSString concatenation looks expensive, let me rewrite it with
// a mutable buffer" — optimizing based on a hunch, with no measurement.
- (NSString *)buildSummary {
    NSMutableString *summary = [NSMutableString string];
    for (OMWLineItem *item in self.lineItems) {
        [summary appendFormat:@"%@: %.2f\n", item.name, item.amount];
    }
    return summary; // Actually <1% of total frame time in this method
}

// Meanwhile, the real bottleneck — an uncached NSDateFormatter rebuilt
// per row inside -tableView:cellForRowAtIndexPath: — goes untouched
// because it "looked fine" on read-through.
```

## Good

```objc
// 1. Capture a Time Profiler trace during the actual slow interaction
//    (e.g. scrolling the table that feels janky).
// 2. Read the heaviest stack in the call tree — it points at
//    -[OMWTransactionCell configureWithTransaction:] building a fresh
//    NSDateFormatter on every call.
// 3. Fix the actual bottleneck the trace identified:
@interface OMWTransactionCell ()
@property (nonatomic, strong) NSDateFormatter *dateFormatter; // built once, reused
@end

// 4. Re-run the same Time Profiler trace and confirm the heaviest stack
//    frame moved elsewhere (or disappeared), rather than assuming the
//    fix helped.
```

## Instruments Templates and What They Answer

| Template | Question it answers |
|----------|---------------------|
| Time Profiler | Which functions/methods consume wall-clock CPU time? |
| Allocations | What's allocating, how much, and where's the retain count going? |
| Leaks | What objects are never deallocated? |
| Core Data | Which fetch requests/faults are slow or redundant? |
| Core Animation (FPS) | Is the app actually dropping frames, and when? |
| System Trace | Is the main thread blocked on I/O or lock contention? |

## Reading a Time Profiler Trace

```
Call Tree (Time Profiler)
├── Invert Call Tree: ON   — shows leaf functions burning the most CPU first
├── Hide System Libraries: ON — focuses on your own frames
└── Look for:
    ├── objc_msgSend at the top — usually fine, it's just message dispatch
    ├── Your own method names taking > a few % of total samples
    ├── Repeated allocation/format-string frames inside a loop
    └── Unexpectedly deep recursion or retain/release traffic
```

## Measure Before and After, Not Just Before

```objc
// XCTest performance metrics give a repeatable, CI-trackable measurement
// instead of an eyeballed "feels faster" judgment.
- (void)testTransactionSummaryPerformance {
    [self measureBlock:^{
        [self.viewModel buildSummary];
    }];
}
```

## See Also

- [`perf-avoid-string-format-in-loop`](perf-avoid-string-format-in-loop.md) - Avoid `stringWithFormat:`/`NSLog` inside hot loops
- [`test-performance-measure-block`](test-performance-measure-block.md) - Use `-measureBlock:`/`XCTMetric` for performance regressions
- [`perf-avoid-alloc-in-drawrect`](perf-avoid-alloc-in-drawrect.md) - Avoid allocating objects inside `drawRect:`/render loops
