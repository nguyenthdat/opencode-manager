# arc-autoreleasepool-loop

> Wrap tight allocation loops in `@autoreleasepool`

## Why It Matters

Autoreleased objects (returned from many Foundation convenience constructors, or produced internally by ARC) are only deallocated when the enclosing autorelease pool drains. Outside of UIKit/AppKit's per-runloop-iteration pool, a tight loop that creates many autoreleased temporaries (image decoding, string parsing, `NSData` slicing) can accumulate huge peak memory before the pool ever drains, leading to memory warnings or jetsam kills on iOS. Wrapping the loop body in `@autoreleasepool` drains temporaries every iteration, keeping peak memory flat.

## Bad

```objc
- (void)processImagesAtPaths:(NSArray<NSString *> *)paths {
    for (NSString *path in paths) {
        NSData *data = [NSData dataWithContentsOfFile:path];  // Autoreleased intermediate
        UIImage *image = [UIImage imageWithData:data];        // Autoreleased intermediate
        UIImage *thumbnail = [self thumbnailForImage:image];  // More autoreleased temporaries
        [self.thumbnails addObject:thumbnail];
        // With 10,000 large images, none of these temporaries are freed until this
        // method's own autorelease pool (way up the call stack) eventually drains.
    }
}
```

## Good

```objc
- (void)processImagesAtPaths:(NSArray<NSString *> *)paths {
    for (NSString *path in paths) {
        @autoreleasepool {
            NSData *data = [NSData dataWithContentsOfFile:path];
            UIImage *image = [UIImage imageWithData:data];
            UIImage *thumbnail = [self thumbnailForImage:image];
            [self.thumbnails addObject:thumbnail];
        }  // Pool drains here every iteration; peak memory stays flat
    }
}
```

## Background Thread Loops Without a Runloop Pool

```objc
// Detached threads and dispatch queues do NOT get an implicit per-iteration
// autorelease pool the way the main runloop does, so long-running background
// work needs an explicit pool even for a single top-level loop:
dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{
    for (NSUInteger i = 0; i < 1000000; i++) {
        @autoreleasepool {
            [self processRecordAtIndex:i];  // Each record's temporaries drain immediately
        }
    }
});
```

## Measuring Before Adding a Pool

```objc
// Not every loop needs one - only loops that create a meaningful number of
// autoreleased temporaries per iteration. Adding @autoreleasepool has a small
// fixed cost, so profile with Instruments' Allocations tool to confirm the
// peak-memory problem exists before wrapping every loop reflexively.
```

## See Also

- [`perf-decode-image-off-main`](perf-decode-image-off-main.md) - Decode/resize images off the main thread
- [`perf-profile-instruments-first`](perf-profile-instruments-first.md) - Profile with Instruments before optimizing
- [`arc-no-manual-memory-calls`](arc-no-manual-memory-calls.md) - Never call `retain`/`release`/`autorelease` under ARC
