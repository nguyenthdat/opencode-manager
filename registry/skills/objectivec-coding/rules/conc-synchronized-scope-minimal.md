# conc-synchronized-scope-minimal

> Keep `@synchronized` blocks minimal and never nested

## Why It Matters

`@synchronized(obj)` acquires a recursive lock keyed on `obj`'s identity, but the compiler-generated lock table means the cost and blast radius grow with everything inside the block. A large `@synchronized` scope serializes unrelated work (network calls, disk I/O, other method calls that themselves try to lock the same object), and nesting two `@synchronized` blocks on different objects invites classic lock-ordering deadlocks the moment another thread locks the same two objects in the opposite order.

## Bad

```objc
- (void)recordEvent:(OMWEvent *)event {
    @synchronized (self) {
        // Far more than the shared state needs to be protected here.
        [self.eventBuffer addObject:event];
        [self.eventBuffer sortUsingComparator:^NSComparisonResult(OMWEvent *a, OMWEvent *b) {
            return [a.timestamp compare:b.timestamp];
        }];
        [self flushBufferToDiskIfNeeded];      // Disk I/O under the lock!
        [self.delegate eventStoreDidRecordEvent:self]; // Calls out to unknown code under the lock.
    }
}

- (void)transferFromAccount:(OMWAccount *)from toAccount:(OMWAccount *)to amount:(NSDecimalNumber *)amount {
    @synchronized (from) {
        @synchronized (to) {
            // Nested locks on two different objects: a concurrent transfer
            // in the opposite direction (to -> from) can deadlock here.
            [from debit:amount];
            [to credit:amount];
        }
    }
}
```

## Good

```objc
- (void)recordEvent:(OMWEvent *)event {
    @synchronized (self) {
        [self.eventBuffer addObject:event];
    }
    // Everything below happens outside the lock.
    [self flushBufferToDiskIfNeeded];
    [self.delegate eventStoreDidRecordEvent:self];
}

- (void)transferFromAccount:(OMWAccount *)from toAccount:(OMWAccount *)to amount:(NSDecimalNumber *)amount {
    // Establish a single, global lock ordering (e.g. by object identity)
    // instead of nesting locks in call-site-dependent order.
    OMWAccount *first = ([from hash] < [to hash]) ? from : to;
    OMWAccount *second = (first == from) ? to : from;

    @synchronized (first) {
        @synchronized (second) {
            [from debit:amount];
            [to credit:amount];
        }
    }
}
```

## Prefer a Dedicated Lock Object

```objc
// @synchronized(self) also blocks anyone else who happens to lock self
// (e.g. a category or subclass). Locking a private object avoids
// accidental cross-talk with unrelated code that shares self's identity.
@interface OMWEventStore ()
@property (nonatomic, strong) NSObject *bufferLock;
@end

- (void)recordEvent:(OMWEvent *)event {
    @synchronized (self.bufferLock) {
        [self.eventBuffer addObject:event];
    }
}
```

## See Also

- [`anti-synchronized-giant-scope`](anti-synchronized-giant-scope.md) - Don't wrap large swaths of code in one `@synchronized` block
- [`conc-nslock-explicit-when-needed`](conc-nslock-explicit-when-needed.md) - Use `NSLock`/`NSRecursiveLock` explicitly when `@synchronized` overhead isn't wanted
- [`conc-serial-queue-state-protection`](conc-serial-queue-state-protection.md) - Protect shared mutable state with a private serial queue instead of ad hoc locks
- [`conc-avoid-priority-inversion`](conc-avoid-priority-inversion.md) - Avoid blocking high-priority queues on low-priority/background work
