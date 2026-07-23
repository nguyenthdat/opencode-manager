# conc-serial-queue-state-protection

> Protect shared mutable state with a private serial queue instead of ad hoc locks

## Why It Matters

A private serial `dispatch_queue_t` gives you the same mutual-exclusion guarantee as a lock, but with none of the deadlock risk from forgetting to unlock on an early return, and it composes naturally with the rest of a GCD-based design (you can dispatch async writes and sync reads to the same queue). Mixing locks and queues for the same piece of state is a common source of subtle races, since one code path may bypass the lock entirely.

## Bad

```objc
@interface OMWMetricsCollector ()
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *counts;
@end

@implementation OMWMetricsCollector

- (void)incrementCounter:(NSString *)name {
    // Called from multiple background queues with no protection at all.
    NSNumber *current = self.counts[name] ?: @0;
    self.counts[name] = @(current.integerValue + 1); // Racy read-modify-write.
}

- (NSDictionary<NSString *, NSNumber *> *)snapshot {
    return [self.counts copy]; // Can race with a concurrent mutation above.
}

@end
```

## Good

```objc
@interface OMWMetricsCollector ()
@property (nonatomic, strong) dispatch_queue_t stateQueue;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *counts;
@end

@implementation OMWMetricsCollector

- (instancetype)init {
    self = [super init];
    if (self) {
        _stateQueue = dispatch_queue_create("com.omw.metrics.state", DISPATCH_QUEUE_SERIAL);
        _counts = [NSMutableDictionary dictionary];
    }
    return self;
}

- (void)incrementCounter:(NSString *)name {
    dispatch_async(self.stateQueue, ^{
        NSNumber *current = self.counts[name] ?: @0;
        self.counts[name] = @(current.integerValue + 1);
    });
}

- (NSDictionary<NSString *, NSNumber *> *)snapshot {
    __block NSDictionary<NSString *, NSNumber *> *result;
    // Sync read: caller blocks until any pending async writes have applied.
    dispatch_sync(self.stateQueue, ^{
        result = [self.counts copy];
    });
    return result;
}

@end
```

## Never Call `dispatch_sync` on the Same Queue You're Already On

```objc
// If incrementCounter: is ever called while already running on
// self.stateQueue, dispatch_sync to the same serial queue deadlocks.
- (void)resetIfNeeded {
    dispatch_sync(self.stateQueue, ^{
        // Safe here only because this method itself is not invoked
        // from a block already running on stateQueue.
        [self.counts removeAllObjects];
    });
}
// Prefer dispatch_async for writes, and reserve dispatch_sync for reads
// that must return a value synchronously to a caller on a different queue.
```

## See Also

- [`conc-gcd-queue-choice`](conc-gcd-queue-choice.md) - Choose a serial or concurrent GCD queue deliberately based on ordering needs
- [`conc-dispatch-barrier-readwrite`](conc-dispatch-barrier-readwrite.md) - Use a concurrent queue with barrier writes for reader/writer synchronization
- [`conc-nslock-explicit-when-needed`](conc-nslock-explicit-when-needed.md) - Use `NSLock`/`NSRecursiveLock` explicitly when `@synchronized` overhead isn't wanted
