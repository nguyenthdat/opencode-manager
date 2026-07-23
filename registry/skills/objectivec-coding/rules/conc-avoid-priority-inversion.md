# conc-avoid-priority-inversion

> Avoid blocking high-priority queues on low-priority/background work

## Why It Matters

When a high-QoS task (e.g. something on the main queue) waits on a lock or `dispatch_sync` result that a low-QoS background thread must produce, the system can suffer priority inversion: the low-priority thread doesn't get scheduled quickly because nothing boosts it, so the high-priority thread stalls indefinitely, manifesting as UI hangs or watchdog terminations. GCD's automatic QoS propagation on `dispatch_async` closures helps, but naive locking or `dispatch_sync` across queues with very different QoS classes can still starve the high-priority side.

## Bad

```objc
@interface OMWImageCache ()
@property (nonatomic, strong) NSLock *lock;
@end

- (void)precomputeThumbnailsInBackground {
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_BACKGROUND, 0), ^{
        [self.lock lock];
        // Long-running, low-priority work while holding the lock.
        [self regenerateAllThumbnails];
        [self.lock unlock];
    });
}

- (UIImage *)thumbnailForKey:(NSString *)key {
    // Called from the main thread during scrolling - blocks on the same
    // lock a QOS_CLASS_BACKGROUND thread is holding for a long operation.
    [self.lock lock];
    UIImage *image = self.thumbnails[key];
    [self.lock unlock];
    return image;
}
```

## Good

```objc
@interface OMWImageCache ()
@property (nonatomic, strong) dispatch_queue_t stateQueue;
@end

- (instancetype)init {
    self = [super init];
    if (self) {
        _stateQueue = dispatch_queue_create("com.omw.imagecache.state", DISPATCH_QUEUE_SERIAL);
    }
    return self;
}

- (void)precomputeThumbnailsInBackground {
    // Regenerate off-queue; only hop onto stateQueue for the brief
    // moment needed to publish each result, keeping the lock hold time short.
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{
        for (NSString *key in self.pendingKeys) {
            UIImage *thumbnail = [self regenerateThumbnailForKey:key];
            dispatch_async(self.stateQueue, ^{
                self.thumbnails[key] = thumbnail;
            });
        }
    });
}

- (UIImage *)thumbnailForKey:(NSString *)key {
    __block UIImage *image;
    dispatch_sync(self.stateQueue, ^{
        image = self.thumbnails[key];
    });
    return image;
}
```

## Use `dispatch_block_create` QoS Flags When Manually Bridging Priorities

```objc
// If a high-QoS caller truly must wait on lower-QoS work, mark the
// block so GCD boosts its executing thread's priority for the duration,
// rather than leaving it to run at its enqueued (low) priority.
dispatch_block_t work = dispatch_block_create(DISPATCH_BLOCK_ENFORCE_QOS_CLASS, ^{
    [self regenerateAllThumbnails];
});
dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), work);
```

## See Also

- [`conc-serial-queue-state-protection`](conc-serial-queue-state-protection.md) - Protect shared mutable state with a private serial queue instead of ad hoc locks
- [`conc-avoid-blocking-main-thread`](conc-avoid-blocking-main-thread.md) - Never perform synchronous network/disk I/O on the main thread
- [`conc-gcd-queue-choice`](conc-gcd-queue-choice.md) - Choose a serial or concurrent GCD queue deliberately based on ordering needs
