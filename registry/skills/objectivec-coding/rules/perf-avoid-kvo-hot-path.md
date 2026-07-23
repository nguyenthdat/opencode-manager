# perf-avoid-kvo-hot-path

> Avoid KVO on properties that mutate in tight loops

## Why It Matters

Every KVO-observed property write goes through `willChangeValueForKey:`/`didChangeValueForKey:`, isa-swizzling-based dynamic subclass dispatch, and a fan-out to every registered observer — overhead that's negligible for occasional UI-state changes but adds up fast inside a loop that updates the same property hundreds or thousands of times per second (e.g., streaming a progress value or accumulating a running total).

## Bad

```objc
@interface OMWFileHasher : NSObject
@property (nonatomic, assign) double bytesProcessed; // KVO-observed elsewhere
@end

@implementation OMWFileHasher

- (void)hashFileAtURL:(NSURL *)url {
    NSInputStream *stream = [NSInputStream inputStreamWithURL:url];
    [stream open];
    uint8_t buffer[4096];
    NSInteger bytesRead;
    while ((bytesRead = [stream read:buffer maxLength:sizeof(buffer)]) > 0) {
        [self updateHashWithBytes:buffer length:bytesRead];
        // Fires KVO willChange/didChange notifications on every 4KB
        // chunk — for a multi-GB file that's tens of thousands of
        // observer dispatches, most of which nobody needs.
        self.bytesProcessed += bytesRead;
    }
}

@end
```

## Good

```objc
@interface OMWFileHasher ()
@property (nonatomic, assign) double bytesProcessed; // still KVO-compliant for external observers
@end

@implementation OMWFileHasher

- (void)hashFileAtURL:(NSURL *)url {
    NSInputStream *stream = [NSInputStream inputStreamWithURL:url];
    [stream open];
    uint8_t buffer[4096];
    NSInteger bytesRead;
    double accumulatedBytes = 0;
    NSTimeInterval lastNotifyTime = 0;

    while ((bytesRead = [stream read:buffer maxLength:sizeof(buffer)]) > 0) {
        [self updateHashWithBytes:buffer length:bytesRead];
        accumulatedBytes += bytesRead;

        // Coalesce KVO notifications to a few times per second instead
        // of once per 4KB chunk. Observers still see smooth progress.
        NSTimeInterval now = CFAbsoluteTimeGetCurrent();
        if (now - lastNotifyTime > 0.05) {
            self.bytesProcessed = accumulatedBytes; // one KVO fire per ~50ms
            lastNotifyTime = now;
        }
    }
    self.bytesProcessed = accumulatedBytes; // final, guaranteed update
}

@end
```

## Prefer a Delegate Callback Instead of KVO for This Case

```objc
// If nothing outside this class truly needs arbitrary external
// observation, a lightweight delegate callback avoids KVO's dispatch
// overhead entirely and is easier to reason about.
@protocol OMWFileHasherProgressDelegate <NSObject>
- (void)fileHasher:(OMWFileHasher *)hasher didProcessBytes:(double)bytesProcessed;
@end
```

## See Also

- [`kvc-avoid-kvo-overuse`](kvc-avoid-kvo-overuse.md) - Prefer a delegate/block callback over KVO when observation is simple
- [`perf-avoid-boxing-hot-loop`](perf-avoid-boxing-hot-loop.md) - Avoid boxing primitives into `NSNumber` inside hot loops
- [`perf-profile-instruments-first`](perf-profile-instruments-first.md) - Profile with Instruments before optimizing
