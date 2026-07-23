# conc-document-thread-safety-contract

> Document the thread-confinement/thread-safety contract of shared objects

## Why It Matters

Whether a class is safe to call from any thread, safe only from one designated queue, or safe only from the main thread is invisible from its method signatures - Objective-C has no compiler-checked thread annotations comparable to Swift's actors. Without an explicit, written contract, callers guess, and the guess is wrong often enough that undocumented classes are a leading source of intermittent, hard-to-reproduce crashes reported from the field but never seen in development.

## Bad

```objc
// No indication anywhere that this class is main-thread-only, or that
// calling from a background queue silently produces stale reads.
@interface OMWSessionCache : NSObject
- (void)storeToken:(NSString *)token forUserID:(NSString *)userID;
- (nullable NSString *)tokenForUserID:(NSString *)userID;
@end

// A caller has no way to know this is unsafe:
dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{
    [sessionCache storeToken:newToken forUserID:userID]; // Actually only main-thread-safe.
});
```

## Good

```objc
/**
 * OMWSessionCache stores per-user auth tokens in memory.
 *
 * Thread safety: NOT thread-safe. All methods must be called from the
 * main thread/queue only; the backing dictionary is not synchronized.
 * If you need background access, use OMWSessionCache+Concurrent instead.
 */
@interface OMWSessionCache : NSObject
- (void)storeToken:(NSString *)token forUserID:(NSString *)userID;
- (nullable NSString *)tokenForUserID:(NSString *)userID;
@end
```

## Documenting a Genuinely Thread-Safe Class

```objc
/**
 * OMWMetricsCollector accumulates counters from any thread.
 *
 * Thread safety: fully thread-safe. All public methods may be called
 * concurrently from any queue; internal state is protected by a
 * private serial dispatch queue (see conc-serial-queue-state-protection).
 */
@interface OMWMetricsCollector : NSObject
- (void)incrementCounter:(NSString *)name;
- (NSDictionary<NSString *, NSNumber *> *)snapshot;
@end
```

## Enforcing the Contract, Not Just Describing It

```objc
// Where practical, back the documentation with a runtime assertion so a
// violation fails loudly in development instead of silently in production.
- (void)storeToken:(NSString *)token forUserID:(NSString *)userID {
    NSAssert(NSThread.isMainThread, @"OMWSessionCache must be used from the main thread");
    self.tokensByUserID[userID] = token;
}
```

## A Short Vocabulary for the Contract

- **Not thread-safe / main-thread-only** - document explicitly which queue.
- **Internally synchronized** - safe from any thread, state protected internally (lock or serial queue).
- **Thread-confined by convention** - safe as long as the *caller* always uses one particular queue (common for delegate callbacks); document which queue delivers the callbacks.

## See Also

- [`doc-thread-safety-documented`](doc-thread-safety-documented.md) - State a type's thread-safety guarantees in its header comment
- [`conc-serial-queue-state-protection`](conc-serial-queue-state-protection.md) - Protect shared mutable state with a private serial queue instead of ad hoc locks
- [`conc-nsoperation-cancellation-check`](conc-nsoperation-cancellation-check.md) - Poll `isCancelled` inside long-running `NSOperation` work
