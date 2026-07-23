# anti-synchronized-giant-scope

> Don't wrap large swaths of code in one `@synchronized` block

## Why It Matters

`@synchronized` locks on an object's address for the duration of the block, and every additional line inside that block — especially anything that calls out to another object, does I/O, or waits on another lock — extends how long every other thread contending for that same lock has to wait. A giant `@synchronized` block that spans network calls, delegate callbacks, or nested locking on a second object is a direct path to priority inversion, effective serialization of work that didn't need to be serialized, and deadlock if the nested call re-enters a lock the current thread already holds (from a different object) in the opposite order somewhere else in the codebase.

## Bad

```objc
- (void)processIncomingMessage:(OMWMessage *)message {
    @synchronized (self) {
        [self.messageCache addObject:message];   // Needs protection.
        [self.delegate messageProcessorDidReceiveMessage:message];   // Calls
                                                                       // out to
                                                                       // arbitrary
                                                                       // delegate
                                                                       // code while
                                                                       // holding
                                                                       // the lock.
        [self.networkClient acknowledgeMessage:message];   // Blocking I/O
                                                              // while holding
                                                              // the lock --
                                                              // every other
                                                              // thread that
                                                              // needs `self`
                                                              // stalls for
                                                              // the network
                                                              // round trip.
        [self recalculateUnreadCount];
    }
}
```

## Good

```objc
- (void)processIncomingMessage:(OMWMessage *)message {
    @synchronized (self) {
        [self.messageCache addObject:message];   // Only the shared
        [self recalculateUnreadCount];            // mutable state is
                                                    // protected.
    }
    // Delegate callbacks and network calls happen outside the lock,
    // so they don't block other threads that need `self`'s cache.
    [self.delegate messageProcessorDidReceiveMessage:message];
    [self.networkClient acknowledgeMessage:message];
}
```

## Prefer a Dedicated Lock Object Over `self`

```objc
// Locking on `self` also risks an unrelated caller synchronizing on
// the same object for a different purpose (e.g. framework code
// locking on your object internally), creating contention you don't
// control. A private, dedicated lock object avoids that entirely and
// makes the intent explicit.
@interface OMWMessageProcessor ()
@property (nonatomic, strong) NSObject *cacheLock;
@end

- (void)processIncomingMessage:(OMWMessage *)message {
    @synchronized (self.cacheLock) {
        [self.messageCache addObject:message];
        [self recalculateUnreadCount];
    }
    [self.delegate messageProcessorDidReceiveMessage:message];
}
```

## A Faster Alternative for Hot Paths

```objc
// For a hot path where @synchronized's overhead (which includes
// exception-handling setup) matters, a serial dispatch queue often
// gives the same mutual-exclusion guarantee more cheaply.
dispatch_async(self.cacheQueue, ^{
    [self.messageCache addObject:message];
    [self recalculateUnreadCount];
});
```

## See Also

- [`conc-synchronized-scope-minimal`](conc-synchronized-scope-minimal.md) - Keep `@synchronized` blocks minimal and never nested
- [`conc-avoid-priority-inversion`](conc-avoid-priority-inversion.md) - Avoid blocking high-priority queues on low-priority/background work
- [`conc-serial-queue-state-protection`](conc-serial-queue-state-protection.md) - Protect shared mutable state with a private serial queue instead of ad hoc locks
