# kvc-remove-observer-before-dealloc

> Always remove KVO observers before the observed object deallocates

## Why It Matters

If an observed object deallocates while an observer is still registered, the KVO machinery attempts to notify a listener that may itself already be gone or may receive a callback in a nonsensical state, and Foundation raises `NSInternalInconsistencyException` ("An instance ... was deallocated while key value observers were still registered"), crashing the app. This is one of the most common ARC-era Objective-C crashes because the observer/observed lifetimes rarely match cleanly by accident.

## Bad

```objc
@interface OMWDownloadViewController ()
@end

@implementation OMWDownloadViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    [self.task addObserver:self forKeyPath:@"fractionCompleted" options:0 context:NULL];
}

// No -dealloc override at all: if this view controller is deallocated
// while self.task outlives it (e.g. task is also referenced elsewhere),
// or if self.task deallocates first, either side can crash.

@end
```

## Good

```objc
@interface OMWDownloadViewController ()
@property (nonatomic, assign) BOOL isObservingTask;
@end

@implementation OMWDownloadViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    [self.task addObserver:self forKeyPath:@"fractionCompleted" options:0 context:NULL];
    self.isObservingTask = YES;
}

- (void)dealloc {
    if (self.isObservingTask) {
        [self.task removeObserver:self forKeyPath:@"fractionCompleted"];
    }
}

@end
```

## Removing Defensively When Removal Order Is Uncertain

```objc
// -removeObserver:forKeyPath: throws if no matching observer is
// registered. Guard with a flag (as above) rather than wrapping every
// removal in @try/@catch, which papers over real bugs.
- (void)stopObservingTask {
    if (self.isObservingTask) {
        [self.task removeObserver:self forKeyPath:@"fractionCompleted"];
        self.isObservingTask = NO;
    }
}

- (void)dealloc {
    [self stopObservingTask];
}
```

## iOS 11+/macOS 10.13+ Block-Based Tokens Avoid This Entirely

```objc
// NSKeyValueObservation-returning APIs (Swift-only surface, but the
// block-based NSNotificationCenter equivalent applies the same idea)
// tie removal to the token's own lifetime - see kvc-notification-block-observer-token
// for the NSNotificationCenter analogue of this same pattern.
```

## See Also

- [`kvc-context-pointer-disambiguate`](kvc-context-pointer-disambiguate.md) - Disambiguate KVO callbacks with a private static context pointer
- [`arc-dealloc-observer-cleanup`](arc-dealloc-observer-cleanup.md) - Remove observers and invalidate timers in `dealloc`
- [`anti-kvo-without-removal`](anti-kvo-without-removal.md) - Don't add a KVO observer without a matching, guaranteed removal
- [`kvc-observer-retain-cycle-avoid`](kvc-observer-retain-cycle-avoid.md) - Avoid retain cycles from strongly-held notification/KVO observer references
