# conc-dispatch-barrier-readwrite

> Use a concurrent queue with barrier writes for reader/writer synchronization

## Why It Matters

Serializing every access (reads included) through a plain serial queue throws away all read concurrency, even though concurrent reads of unchanged state are perfectly safe. A concurrent queue with `dispatch_barrier_async` for writes gets you the best of both: reads run in parallel with each other, while a barrier write waits for all in-flight reads to finish and blocks any new reads until it completes - the same semantics as a reader-writer lock, without hand-writing one.

## Bad

```objc
@interface OMWConfigStore ()
@property (nonatomic, strong) dispatch_queue_t queue; // Serial: reads can't overlap.
@property (nonatomic, strong) NSMutableDictionary<NSString *, id> *storage;
@end

- (instancetype)init {
    self = [super init];
    if (self) {
        _queue = dispatch_queue_create("com.omw.config", DISPATCH_QUEUE_SERIAL);
        _storage = [NSMutableDictionary dictionary];
    }
    return self;
}

- (id)valueForKey:(NSString *)key {
    __block id value;
    // Every read is fully serialized against every other read, even
    // though concurrent reads of immutable snapshots are safe.
    dispatch_sync(self.queue, ^{
        value = self.storage[key];
    });
    return value;
}

- (void)setValue:(id)value forKey:(NSString *)key {
    dispatch_async(self.queue, ^{
        self.storage[key] = value;
    });
}
```

## Good

```objc
@interface OMWConfigStore ()
@property (nonatomic, strong) dispatch_queue_t queue; // Concurrent.
@property (nonatomic, strong) NSMutableDictionary<NSString *, id> *storage;
@end

- (instancetype)init {
    self = [super init];
    if (self) {
        _queue = dispatch_queue_create("com.omw.config", DISPATCH_QUEUE_CONCURRENT);
        _storage = [NSMutableDictionary dictionary];
    }
    return self;
}

- (id)valueForKey:(NSString *)key {
    __block id value;
    // Concurrent reads can run simultaneously with each other.
    dispatch_sync(self.queue, ^{
        value = self.storage[key];
    });
    return value;
}

- (void)setValue:(id)value forKey:(NSString *)key {
    // Barrier: waits for in-flight reads, excludes new reads until done,
    // and mutations to storage are never interleaved with a read.
    dispatch_barrier_async(self.queue, ^{
        self.storage[key] = value;
    });
}

@end
```

## Barrier + Sync for a Read-Modify-Write That Must Return a Value

```objc
- (NSInteger)incrementCounterForKey:(NSString *)key {
    __block NSInteger newValue;
    dispatch_barrier_sync(self.queue, ^{
        NSNumber *current = self.storage[key] ?: @0;
        newValue = current.integerValue + 1;
        self.storage[key] = @(newValue);
    });
    return newValue;
}
```

## See Also

- [`conc-serial-queue-state-protection`](conc-serial-queue-state-protection.md) - Protect shared mutable state with a private serial queue instead of ad hoc locks
- [`conc-gcd-queue-choice`](conc-gcd-queue-choice.md) - Choose a serial or concurrent GCD queue deliberately based on ordering needs
- [`perf-avoid-kvo-hot-path`](perf-avoid-kvo-hot-path.md) - Avoid KVO on properties that mutate in tight loops
