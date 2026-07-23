# anti-kvo-without-removal

> Don't add a KVO observer without a matching, guaranteed removal

## Why It Matters

Key-Value Observing does not automatically clean itself up: if an observer is deallocated (or the observed object outlives it) without a matching `removeObserver:forKeyPath:`, the observed object holds a dangling reference to the observer's address and the next change fires `observeValueForKeyPath:ofObject:change:context:` on freed memory — a classic, hard-to-reproduce crash (`EXC_BAD_ACCESS` in `NSKeyValueObserving`) that often only shows up under memory pressure when the deallocated object's memory has been reused. Even without a crash, an observer registered twice without a matching pair of removals fires its callback twice per change, which is its own class of subtle bug.

## Bad

```objc
@implementation OMWDownloadProgressView

- (void)startObservingTask:(OMWDownloadTask *)task {
    [task addObserver:self forKeyPath:@"fractionCompleted" options:0 context:NULL];
    self.observedTask = task;
    // No corresponding removeObserver: anywhere in this class. If this
    // view is deallocated while still observing (or if -stopObserving
    // is simply never called on some code path), OMWDownloadTask keeps
    // sending KVO callbacks to a deallocated observer.
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                       ofObject:(id)object
                         change:(NSDictionary *)change
                        context:(void *)context {
    self.progressBar.progress = self.observedTask.fractionCompleted;
}

@end
```

## Good

```objc
@implementation OMWDownloadProgressView

- (void)startObservingTask:(OMWDownloadTask *)task {
    [self stopObserving];   // Guard against double-registration.
    [task addObserver:self forKeyPath:@"fractionCompleted" options:0 context:&kOMWProgressContext];
    self.observedTask = task;
}

- (void)stopObserving {
    if (self.observedTask != nil) {
        [self.observedTask removeObserver:self forKeyPath:@"fractionCompleted" context:&kOMWProgressContext];
        self.observedTask = nil;
    }
}

- (void)dealloc {
    [self stopObserving];   // Guaranteed removal on every deallocation path.
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                       ofObject:(id)object
                         change:(NSDictionary *)change
                        context:(void *)context {
    if (context != &kOMWProgressContext) {
        [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
        return;
    }
    self.progressBar.progress = self.observedTask.fractionCompleted;
}

@end
```

## A Common Trap: Removing in the Wrong Place

```objc
// Removing only in a "stop" method that isn't guaranteed to run (e.g.
// -viewWillDisappear: on a view controller that can also be
// deallocated directly without that lifecycle callback firing, such as
// when popped without animation) is not sufficient on its own --
// -dealloc must also remove the observer as a last-resort guarantee.
- (void)viewWillDisappear:(BOOL)animated {
    [super viewWillDisappear:animated];
    [self stopObserving];   // Good, but not sufficient alone.
}

- (void)dealloc {
    [self stopObserving];   // The guarantee: always runs exactly once.
}
```

## See Also

- [`kvc-remove-observer-before-dealloc`](kvc-remove-observer-before-dealloc.md) - Always remove KVO observers before the observed object deallocates
- [`kvc-observer-retain-cycle-avoid`](kvc-observer-retain-cycle-avoid.md) - Avoid retain cycles from strongly-held notification/KVO observer references
- [`kvc-context-pointer-disambiguate`](kvc-context-pointer-disambiguate.md) - Disambiguate KVO callbacks with a private static context pointer
