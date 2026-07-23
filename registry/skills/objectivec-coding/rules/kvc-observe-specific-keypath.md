# kvc-observe-specific-keypath

> Observe specific, well-scoped key paths, not broad wildcard state

## Why It Matters

Observing an entire object graph "just in case" (or subscribing to every property of a model instead of the one you actually need) fires the observer far more often than necessary, forces the handler to re-derive which property actually changed, and makes it easy to accidentally react to unrelated mutations. A precise key path keeps the observer's intent legible and its cost proportional to what actually changed.

## Bad

```objc
@interface OMWDownloadViewController ()
@end

- (void)viewDidLoad {
    [super viewDidLoad];
    // Observes the whole task object with no keyPath specificity in the
    // handler, forcing a manual dispatch on every unrelated property change.
    [self.task addObserver:self forKeyPath:@"self" options:NSKeyValueObservingOptionNew context:NULL];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object
                         change:(NSDictionary *)change context:(void *)context {
    // Fires on every property change (progress, state, error, etc.) and
    // has to guess which one actually matters for this screen.
    [self.progressView setProgress:self.task.fractionCompleted];
    [self.statusLabel setText:self.task.statusDescription];
}
```

## Good

```objc
static void *OMWDownloadProgressContext = &OMWDownloadProgressContext;

- (void)viewDidLoad {
    [super viewDidLoad];
    // Observe only the single property this screen actually renders.
    [self.task addObserver:self
                 forKeyPath:@"fractionCompleted"
                    options:NSKeyValueObservingOptionNew
                    context:OMWDownloadProgressContext];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object
                         change:(NSDictionary *)change context:(void *)context {
    if (context == OMWDownloadProgressContext) {
        double newValue = [change[NSKeyValueChangeNewKey] doubleValue];
        self.progressView.progress = (float)newValue;
        return;
    }
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
}
```

## Observing Multiple, Explicitly Named Paths

```objc
// If a screen genuinely needs several properties, register each one
// explicitly with its own context rather than one wildcard subscription.
static void *OMWStatusContext = &OMWStatusContext;
static void *OMWErrorContext = &OMWErrorContext;

- (void)startObservingTask:(OMWDownloadTask *)task {
    [task addObserver:self forKeyPath:@"statusDescription" options:0 context:OMWStatusContext];
    [task addObserver:self forKeyPath:@"lastError" options:0 context:OMWErrorContext];
}
```

## See Also

- [`kvc-context-pointer-disambiguate`](kvc-context-pointer-disambiguate.md) - Disambiguate KVO callbacks with a private static context pointer
- [`kvc-remove-observer-before-dealloc`](kvc-remove-observer-before-dealloc.md) - Always remove KVO observers before the observed object deallocates
- [`kvc-avoid-kvo-overuse`](kvc-avoid-kvo-overuse.md) - Prefer a delegate/block callback over KVO when observation is simple
- [`perf-avoid-kvo-hot-path`](perf-avoid-kvo-hot-path.md) - Avoid KVO on properties that mutate in tight loops
