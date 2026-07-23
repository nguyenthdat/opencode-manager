# perf-avoid-string-format-in-loop

> Avoid `stringWithFormat:`/`NSLog` inside hot loops

## Why It Matters

`stringWithFormat:` parses a format string and heap-allocates a new `NSString` on every call; `NSLog` additionally does synchronous I/O to the system log (and stderr in debug builds), which serializes on a lock shared across the whole process. Inside a loop that runs thousands of times, either one turns a cheap iteration into the dominant cost, and `NSLog` specifically can stall on I/O contention under load.

## Bad

```objc
- (void)processRecords:(NSArray<OMWRecord *> *)records {
    for (OMWRecord *record in records) {
        // Runs a full format-string parse per record, purely for a debug
        // trace almost nobody reads in a production build.
        NSLog(@"Processing record %@ with value %.2f at index %lu",
              record.identifier, record.value, (unsigned long)record.index);

        NSString *cacheKey = [NSString stringWithFormat:@"record-%@-%lu",
                                record.identifier, (unsigned long)record.index];
        [self.cache setObject:record forKey:cacheKey];
    }
}
```

## Good

```objc
- (void)processRecords:(NSArray<OMWRecord *> *)records {
    for (OMWRecord *record in records) {
        // No formatting/logging at all on the hot path in release builds.
        NSString *cacheKey = [self cacheKeyForRecord:record]; // see below
        [self.cache setObject:record forKey:cacheKey];
    }
}

// Build the key cheaply via concatenation instead of a format-string
// parse, or better, use a value that doesn't require string construction
// at all (e.g., a composite struct key or the identifier alone).
- (NSString *)cacheKeyForRecord:(OMWRecord *)record {
    return [record.identifier stringByAppendingFormat:@"-%lu", (unsigned long)record.index];
}
```

## Gate Debug Logging Out of Hot Loops Entirely

```objc
// Use a debug-only macro that compiles to nothing in Release, and log
// aggregate information after the loop, not per-iteration.
#if DEBUG
#define OMWLogTrace(fmt, ...) NSLog((fmt), ##__VA_ARGS__)
#else
#define OMWLogTrace(fmt, ...)
#endif

- (void)processRecords:(NSArray<OMWRecord *> *)records {
    NSUInteger processedCount = 0;
    for (OMWRecord *record in records) {
        [self processRecord:record];
        processedCount++;
    }
    OMWLogTrace(@"Processed %lu records", (unsigned long)processedCount); // once, not per-record
}
```

## Prefer `os_log` for Anything That Must Stay in Release Builds

```objc
#import <os/log.h>

static os_log_t OMWProcessingLog(void) {
    static os_log_t log;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        log = os_log_create("com.omw.app", "processing");
    });
    return log;
}

// os_log defers formatting until the log is actually viewed, and is far
// cheaper than NSLog even outside a hot loop — but still avoid per-
// iteration calls in a loop that runs thousands of times per second.
os_log_debug(OMWProcessingLog(), "batch complete: %{public}lu records", (unsigned long)processedCount);
```

## See Also

- [`perf-avoid-boxing-hot-loop`](perf-avoid-boxing-hot-loop.md) - Avoid boxing primitives into `NSNumber` inside hot loops
- [`perf-precompute-predicate-once`](perf-precompute-predicate-once.md) - Build an `NSPredicate` once, reuse it, rather than rebuilding per iteration
- [`perf-profile-instruments-first`](perf-profile-instruments-first.md) - Profile with Instruments before optimizing
