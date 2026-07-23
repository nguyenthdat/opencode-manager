# conc-gcd-queue-choice

> Choose a serial or concurrent GCD queue deliberately based on ordering needs

## Why It Matters

Dispatching work to `DISPATCH_QUEUE_CONCURRENT` when tasks must run in a specific order (or must not run simultaneously against shared state) produces intermittent, hard-to-reproduce ordering bugs and data races. Conversely, forcing independent, parallelizable work onto a serial queue silently throttles your app to one core, wasting available concurrency. The queue type is a correctness decision, not a performance knob to tweak after the fact.

## Bad

```objc
// Log writes must happen in order, but this queue is concurrent.
static dispatch_queue_t sLogQueue;
sLogQueue = dispatch_queue_create("com.omw.logger", DISPATCH_QUEUE_CONCURRENT);

- (void)appendLogLine:(NSString *)line {
    dispatch_async(sLogQueue, ^{
        // Concurrent execution means lines can interleave or land out of order.
        [self.logHandle writeData:[line dataUsingEncoding:NSUTF8StringEncoding]];
    });
}

// Independent image decodes forced onto a serial queue - no parallelism.
static dispatch_queue_t sDecodeQueue;
sDecodeQueue = dispatch_queue_create("com.omw.decode", DISPATCH_QUEUE_SERIAL);

- (void)decodeThumbnails:(NSArray<NSData *> *)thumbnailData {
    for (NSData *data in thumbnailData) {
        dispatch_async(sDecodeQueue, ^{
            // Each decode blocks the next; a concurrent queue would let them overlap.
            UIImage *image = [UIImage imageWithData:data];
            [self cacheDecodedImage:image];
        });
    }
}
```

## Good

```objc
// Ordering matters -> serial queue guarantees FIFO execution.
static dispatch_queue_t sLogQueue;
sLogQueue = dispatch_queue_create("com.omw.logger", DISPATCH_QUEUE_SERIAL);

- (void)appendLogLine:(NSString *)line {
    dispatch_async(sLogQueue, ^{
        [self.logHandle writeData:[line dataUsingEncoding:NSUTF8StringEncoding]];
    });
}

// Independent decodes -> concurrent queue lets them run in parallel.
static dispatch_queue_t sDecodeQueue;
sDecodeQueue = dispatch_queue_create("com.omw.decode", DISPATCH_QUEUE_CONCURRENT);

- (void)decodeThumbnails:(NSArray<NSData *> *)thumbnailData {
    for (NSData *data in thumbnailData) {
        dispatch_async(sDecodeQueue, ^{
            UIImage *image = [UIImage imageWithData:data];
            [self cacheDecodedImage:image];
        });
    }
}
```

## Choosing Between the Two

- Use a **serial** queue when: operations mutate shared state without another lock, ordering is part of the contract (log lines, network request sequencing), or you want a lightweight substitute for a lock (see `conc-serial-queue-state-protection`).
- Use a **concurrent** queue when: tasks are read-only or operate on independent data, and you want GCD to fan them out across available cores - optionally paired with `dispatch_barrier_async` for occasional writes (see `conc-dispatch-barrier-readwrite`).
- A concurrent queue with a `dispatch_group_t` is the right shape for "run N independent things, then continue" (see `conc-dispatch-group-coordination`).

## System Queues Are Concurrent by Default

```objc
// dispatch_get_global_queue always returns a concurrent queue.
dispatch_queue_t background = dispatch_get_global_queue(QOS_CLASS_UTILITY, 0);

// Fine for independent work:
dispatch_async(background, ^{
    NSData *data = [NSData dataWithContentsOfURL:fileURL];
    dispatch_async(dispatch_get_main_queue(), ^{
        [self.delegate fileLoader:self didLoadData:data];
    });
});

// Do NOT serialize shared-state access by hoping tasks "happen" not to overlap.
// Create your own private serial queue instead (see conc-serial-queue-state-protection).
```

## See Also

- [`conc-serial-queue-state-protection`](conc-serial-queue-state-protection.md) - Protect shared mutable state with a private serial queue instead of ad hoc locks
- [`conc-dispatch-barrier-readwrite`](conc-dispatch-barrier-readwrite.md) - Use a concurrent queue with barrier writes for reader/writer synchronization
- [`conc-avoid-priority-inversion`](conc-avoid-priority-inversion.md) - Avoid blocking high-priority queues on low-priority/background work
- [`conc-dispatch-group-coordination`](conc-dispatch-group-coordination.md) - Use `dispatch_group_t` to coordinate multiple async operations
