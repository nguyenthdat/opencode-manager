# arc-dealloc-observer-cleanup

> Remove observers and invalidate timers in `dealloc`

## Why It Matters

`NSNotificationCenter` observers, KVO registrations, and running `NSTimer`/`CADisplayLink` instances all hold a reference back to your object (directly or via the underlying runloop machinery). If you never remove them, your object either can't deallocate at all (because a timer's target reference keeps it alive) or, worse, does deallocate while still registered, so the very next notification or KVO callback messages a freed object and crashes. `dealloc` is the one guaranteed place to tear this down before the object disappears.

## Bad

```objc
@implementation OMWSessionMonitor

- (instancetype)init {
    self = [super init];
    if (self) {
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                  selector:@selector(sessionExpired:)
                                                      name:OMWSessionExpiredNotification
                                                    object:nil];
        [self addObserver:self forKeyPath:@"state" options:0 context:NULL];
    }
    return self;
}

// No -dealloc override at all: the notification center and KVO machinery
// keep pointing at this instance after it's freed elsewhere in the app,
// so the next posted notification or KVO change crashes on a dangling pointer.

@end
```

## Good

```objc
@implementation OMWSessionMonitor

- (instancetype)init {
    self = [super init];
    if (self) {
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                  selector:@selector(sessionExpired:)
                                                      name:OMWSessionExpiredNotification
                                                    object:nil];
        [self addObserver:self forKeyPath:@"state" options:0 context:NULL];
    }
    return self;
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [self removeObserver:self forKeyPath:@"state"];
}

@end
```

## Timers Need Explicit Invalidation, Not Just `nil`-ing

```objc
@implementation OMWPollingService

- (void)startPolling {
    self.pollTimer = [NSTimer scheduledTimerWithTimeInterval:5.0
                                                        target:self
                                                      selector:@selector(poll)
                                                      userInfo:nil
                                                       repeats:YES];
    // The runloop retains the timer, and the timer retains `self` as its target,
    // so simply setting self.pollTimer = nil does NOT stop the timer or release self.
}

- (void)dealloc {
    [self.pollTimer invalidate];  // Required: this is what actually breaks the runloop's hold
}

@end
```

## KVC-based Bulk Observer Removal (Swift-interop-friendly Pattern)

```objc
// For classes that register many key paths, centralize add/remove so dealloc
// can't accidentally miss one:
- (void)registerObservers {
    for (NSString *keyPath in [self observedKeyPaths]) {
        [self addObserver:self forKeyPath:keyPath options:0 context:NULL];
    }
}

- (void)dealloc {
    for (NSString *keyPath in [self observedKeyPaths]) {
        [self removeObserver:self forKeyPath:keyPath];
    }
}
```

## See Also

- [`kvc-remove-observer-before-dealloc`](kvc-remove-observer-before-dealloc.md) - Always remove KVO observers before the observed object deallocates
- [`arc-timer-target-cycle`](arc-timer-target-cycle.md) - Avoid `NSTimer`/`CADisplayLink` strong-target retain cycles
- [`anti-kvo-without-removal`](anti-kvo-without-removal.md) - Don't add a KVO observer without a matching, guaranteed removal
