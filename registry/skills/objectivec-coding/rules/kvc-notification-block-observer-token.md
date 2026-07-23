# kvc-notification-block-observer-token

> Prefer block-based `NSNotificationCenter` observers and keep the removal token

## Why It Matters

The selector-based `-addObserver:selector:name:object:` API requires the observer to implement the handler as a discoverable method and forces an explicit `-removeObserver:` call. The block-based `-addObserverForName:object:queue:usingBlock:` variant returns an opaque token object representing that specific registration; retaining the token and passing it to `-removeObserver:` removes exactly that one subscription, which is safer when a class registers for the same notification more than once (e.g. with different `object:` filters) since selector-based removal by name alone would remove all of them at once.

## Bad

```objc
@implementation OMWSyncStatusView

- (void)viewDidLoad {
    [super viewDidLoad];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                              selector:@selector(handleSyncFinished:)
                                                  name:OMWSyncDidFinishNotification
                                                object:nil];
}

- (void)handleSyncFinished:(NSNotification *)notification {
    // Handler logic lives far from the registration call, and there's
    // no way to distinguish "remove just this subscription" if the
    // view controller ever registers for the same name twice.
    [self refreshStatusIndicator];
}

@end
```

## Good

```objc
@interface OMWSyncStatusView ()
@property (nonatomic, strong, nullable) id<NSObject> syncObserverToken;
@end

@implementation OMWSyncStatusView

- (void)viewDidLoad {
    [super viewDidLoad];
    __weak typeof(self) weakSelf = self;
    self.syncObserverToken = [[NSNotificationCenter defaultCenter]
        addObserverForName:OMWSyncDidFinishNotification
                    object:nil
                     queue:[NSOperationQueue mainQueue]
                usingBlock:^(NSNotification *_Nonnull note) {
        [weakSelf refreshStatusIndicator];
    }];
}

- (void)dealloc {
    if (self.syncObserverToken) {
        [[NSNotificationCenter defaultCenter] removeObserver:self.syncObserverToken];
    }
}

@end
```

## Filtering by `object:` for Multiple Independent Subscriptions

```objc
// Each call returns its own distinct token, so removing one does not
// disturb the other - impossible to express cleanly with selector-based
// registration under the same notification name.
self.uploadToken = [center addObserverForName:OMWTransferDidFinishNotification
                                        object:self.uploadTask
                                         queue:mainQueue
                                    usingBlock:^(NSNotification *note) { /* ... */ }];

self.downloadToken = [center addObserverForName:OMWTransferDidFinishNotification
                                          object:self.downloadTask
                                           queue:mainQueue
                                      usingBlock:^(NSNotification *note) { /* ... */ }];
```

## See Also

- [`kvc-observer-retain-cycle-avoid`](kvc-observer-retain-cycle-avoid.md) - Avoid retain cycles from strongly-held notification/KVO observer references
- [`arc-dealloc-observer-cleanup`](arc-dealloc-observer-cleanup.md) - Remove observers and invalidate timers in `dealloc`
- [`name-notification-name-constant`](name-notification-name-constant.md) - Export notification names as `NSNotificationName` constants, not string literals
