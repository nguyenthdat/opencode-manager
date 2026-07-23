# kvc-avoid-kvo-overuse

> Prefer a delegate/block callback over KVO when observation is simple

## Why It Matters

KVO's stringly-typed key paths, shared `observeValueForKeyPath:...` entry point, and manual add/remove lifecycle add real ceremony and crash risk (see `anti-kvo-without-removal`) for a cost that's only worth paying when you actually need KVO's specific strengths: observing a property you don't own the implementation of, or getting old/new value diffs for free. When a class controls both sides of the relationship and just needs "tell me when this one thing happens," a delegate method or completion block is less code, is compiler-checked, and can't throw `NSInternalInconsistencyException` at runtime.

## Bad

```objc
// KVO used purely to learn when a task the class itself owns finishes -
// there's no independent observer here, just self-signaling machinery.
@interface OMWUploadController ()
@end

- (void)startUpload {
    self.task = [[OMWUploadTask alloc] initWithData:self.payload];
    [self.task addObserver:self forKeyPath:@"isFinished" options:0 context:NULL];
    [self.task start];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object
                         change:(NSDictionary *)change context:(void *)context {
    if ([keyPath isEqualToString:@"isFinished"] && self.task.isFinished) {
        [self.task removeObserver:self forKeyPath:@"isFinished"];
        [self handleUploadResult:self.task.result];
    }
}
```

## Good

```objc
@interface OMWUploadTask : NSObject
- (void)startWithCompletion:(void (^)(OMWUploadResult *_Nullable result, NSError *_Nullable error))completion;
@end

- (void)startUpload {
    self.task = [[OMWUploadTask alloc] initWithData:self.payload];
    __weak typeof(self) weakSelf = self;
    [self.task startWithCompletion:^(OMWUploadResult *_Nullable result, NSError *_Nullable error) {
        [weakSelf handleUploadResult:result error:error];
    }];
}
```

## When KVO Genuinely Earns Its Keep

```objc
// Observing a system-owned object whose implementation you don't
// control, where no delegate/block hook exists - this is exactly
// what KVO was designed for.
[self.playerItem addObserver:self
                   forKeyPath:@"status"
                      options:NSKeyValueObservingOptionNew
                      context:OMWPlayerItemStatusContext];
// AVPlayerItem exposes no per-instance delegate for status changes;
// KVO is the only first-party mechanism available here.
```

## Decision Guide

| Situation | Prefer |
|-----------|--------|
| You own both the observed and observing class | Delegate protocol or block callback |
| One-shot async result | Completion block |
| Observing a system framework type with no callback API | KVO |
| Need old/new value diffing across many properties at once | KVO |
| Cocoa Bindings / `NSArrayController` integration | KVO (indexed accessors) |

## See Also

- [`api-delegate-protocol-pattern`](api-delegate-protocol-pattern.md) - Use a delegate protocol for customizable callbacks
- [`kvc-observe-specific-keypath`](kvc-observe-specific-keypath.md) - Observe specific, well-scoped key paths, not broad wildcard state
- [`anti-kvo-without-removal`](anti-kvo-without-removal.md) - Don't add a KVO observer without a matching, guaranteed removal
- [`perf-avoid-kvo-hot-path`](perf-avoid-kvo-hot-path.md) - Avoid KVO on properties that mutate in tight loops
