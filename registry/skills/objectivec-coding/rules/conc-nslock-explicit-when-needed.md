# conc-nslock-explicit-when-needed

> Use `NSLock`/`NSRecursiveLock` explicitly when `@synchronized` overhead isn't wanted

## Why It Matters

`@synchronized` is convenient but each entry/exit pays for exception-handling setup and a lookup in a global lock table keyed on the object pointer, which is measurably slower than a dedicated `NSLock` on a hot path. An explicit `NSLock` also makes the protected critical section visually obvious at the call site and lets you use `-tryLock` to avoid blocking when contention isn't acceptable, neither of which `@synchronized` offers.

## Bad

```objc
@interface OMWCounter : NSObject
@property (atomic, assign) NSInteger value; // atomic alone doesn't make check-then-set safe.
@end

@implementation OMWCounter

- (void)incrementIfBelow:(NSInteger)limit {
    // Read-then-write race: two threads can both read a value below the
    // limit before either writes back, overshooting the limit.
    if (self.value < limit) {
        self.value = self.value + 1;
    }
}

@end
```

## Good

```objc
@interface OMWCounter ()
@property (nonatomic, strong) NSLock *lock;
@property (nonatomic, assign) NSInteger value;
@end

@implementation OMWCounter

- (instancetype)init {
    self = [super init];
    if (self) {
        _lock = [[NSLock alloc] init];
    }
    return self;
}

- (void)incrementIfBelow:(NSInteger)limit {
    [self.lock lock];
    if (self.value < limit) {
        self.value += 1;
    }
    [self.lock unlock];
}

@end
```

## NSRecursiveLock for Reentrant Call Paths

```objc
// Use NSRecursiveLock when the same thread may re-enter the critical
// section (e.g. a method that calls itself, or a caller that already
// holds the lock invoking another locking method). A plain NSLock
// deadlocks the owning thread against itself in that situation.
@interface OMWTreeNode ()
@property (nonatomic, strong) NSRecursiveLock *lock;
@end

- (void)visitRecursively:(void (^)(OMWTreeNode *node))visitor {
    [self.lock lock];
    visitor(self);
    for (OMWTreeNode *child in self.children) {
        [child visitRecursively:visitor]; // Re-enters child's own recursive lock, fine.
    }
    [self.lock unlock];
}
```

## Always Unlock on Every Path

```objc
// A thrown exception or early return between lock/unlock leaks the lock
// forever. Use @try/@finally when the body can exit abnormally.
- (BOOL)withdraw:(NSDecimalNumber *)amount error:(NSError **)error {
    [self.lock lock];
    @try {
        if ([amount compare:self.balance] == NSOrderedDescending) {
            if (error) { *error = [self insufficientFundsError]; }
            return NO;
        }
        self.balance = [self.balance decimalNumberBySubtracting:amount];
        return YES;
    } @finally {
        [self.lock unlock];
    }
}
```

## See Also

- [`conc-synchronized-scope-minimal`](conc-synchronized-scope-minimal.md) - Keep `@synchronized` blocks minimal and never nested
- [`conc-serial-queue-state-protection`](conc-serial-queue-state-protection.md) - Protect shared mutable state with a private serial queue instead of ad hoc locks
- [`anti-synchronized-giant-scope`](anti-synchronized-giant-scope.md) - Don't wrap large swaths of code in one `@synchronized` block
