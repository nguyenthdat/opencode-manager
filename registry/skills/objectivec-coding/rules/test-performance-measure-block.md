# test-performance-measure-block

> Use `-measureBlock:`/`XCTMetric` for performance regressions

## Why It Matters

Ad hoc timing with `NSDate`/`CACurrentMediaTime` around a chunk of test code produces a single noisy sample with no statistical baseline, no automatic regression detection, and no integration with Xcode's performance-test reporting. `-measureBlock:` (and the newer `XCTMetric`/`measureWithMetrics:` API) runs the block multiple times, records a baseline the first time it passes, and fails the test automatically if a later run regresses beyond a configurable tolerance — turning "this got slower" into a real, trackable CI signal instead of a Slack message someone eventually notices.

## Bad

```objc
- (void)testParseLargePayload_isFast {
    NSData *payload = [self largeJSONPayload];

    NSDate *start = [NSDate date];
    [OMWJSONParser parse:payload];
    NSTimeInterval elapsed = -[start timeIntervalSinceNow];

    XCTAssertLessThan(elapsed, 0.5);   // Single noisy sample; arbitrary hardcoded threshold
}
```

## Good

```objc
- (void)testParseLargePayload_performance {
    NSData *payload = [self largeJSONPayload];

    [self measureBlock:^{
        [OMWJSONParser parse:payload];
    }];
    // Xcode runs this 10x, records mean/stddev, and compares against a stored baseline.
}
```

## Measuring Specific Metrics with `XCTMetric` (Modern XCTest)

```objc
- (void)testParseLargePayload_measuresTimeAndMemory {
    NSData *payload = [self largeJSONPayload];
    XCTCPUMetric *cpuMetric = [[XCTCPUMetric alloc] init];
    XCTMemoryMetric *memoryMetric = [[XCTMemoryMetric alloc] init];

    XCTMeasureOptions *options = [XCTMeasureOptions defaultOptions];
    options.iterationCount = 5;

    [self measureWithMetrics:@[cpuMetric, memoryMetric]
                      options:options
                        block:^{
        [OMWJSONParser parse:payload];
    }];
}
```

## Isolating Setup From the Measured Block

```objc
- (void)testSortLargeUserList_performance {
    NSArray<OMWUser *> *users = [self tenThousandUnsortedUsers];  // Built once, outside measureBlock:

    [self measureBlock:^{
        // Only the operation under test runs inside the timed block
        NSArray *sorted = [users sortedArrayUsingComparator:^NSComparisonResult(OMWUser *a, OMWUser *b) {
            return [a.lastName compare:b.lastName];
        }];
        XCTAssertEqual(sorted.count, users.count);
    }];
}
```

## See Also

- [`test-specific-xctassert-macros`](test-specific-xctassert-macros.md) - Use the most specific `XCTAssert*` macro available
- [`perf-profile-instruments-first`](perf-profile-instruments-first.md) - Profile with Instruments before optimizing
- [`test-uitest-separate-target`](test-uitest-separate-target.md) - Keep `XCUITest` UI tests in a separate target from unit tests
