# kvc-observer-retain-cycle-avoid

> Avoid retain cycles from strongly-held notification/KVO observer references

## Why It Matters

Block-based `NSNotificationCenter` observers and KVO's `observeValueForKeyPath:` closures over `self` create the same capture hazard as any other stored block: if the block strongly captures `self` and the object being observed (directly or transitively) holds a strong reference back to the observer, neither object's retain count ever reaches zero, and both leak for the lifetime of the app. This is easy to miss because the retain path runs through the notification center or the observed object rather than through an obviously-owned property.

## Bad

```objc
@interface OMWSyncStatusView ()
@property (nonatomic, strong) OMWSyncEngine *syncEngine; // Owns/retains this view's observer registration indirectly.
@property (nonatomic, strong, nullable) id<NSObject> token;
@end

- (void)startObserving {
    // Strongly captures self; if syncEngine (which self also strongly
    // retains) is what's holding the notification subscription alive,
    // self -> syncEngine -> notification center -> block -> self is a cycle.
    self.token = [[NSNotificationCenter defaultCenter]
        addObserverForName:OMWSyncDidFinishNotification
                    object:self.syncEngine
                     queue:nil
                usingBlock:^(NSNotification *note) {
        [self refreshStatusIndicator];   // Strong capture of self.
        [self.syncEngine acknowledge];   // Strong capture again.
    }];
}
```

## Good

```objc
@interface OMWSyncStatusView ()
@property (nonatomic, strong) OMWSyncEngine *syncEngine;
@property (nonatomic, strong, nullable) id<NSObject> token;
@end

- (void)startObserving {
    __weak typeof(self) weakSelf = self;
    self.token = [[NSNotificationCenter defaultCenter]
        addObserverForName:OMWSyncDidFinishNotification
                    object:self.syncEngine
                     queue:nil
                usingBlock:^(NSNotification *note) {
        __strong typeof(weakSelf) strongSelf = weakSelf;
        if (!strongSelf) {
            return;
        }
        [strongSelf refreshStatusIndicator];
        [strongSelf.syncEngine acknowledge];
    }];
}

- (void)dealloc {
    if (self.token) {
        [[NSNotificationCenter defaultCenter] removeObserver:self.token];
    }
}
```

## KVO Callbacks Are Naturally Cycle-Free, But Storage Isn't

```objc
// observeValueForKeyPath:ofObject:change:context: is a method, not a
// captured block, so it can't itself create a retain cycle. The risk
// is instead the observed object outliving the observer's expectations
// (or vice versa) - see kvc-remove-observer-before-dealloc for that failure mode.
// The cycle risk specifically applies to block-based registrations
// (notification observers, completion handlers stored as properties).
```

## See Also

- [`arc-weak-strong-self`](arc-weak-strong-self.md) - Capture `__weak self` then re-strengthen inside blocks to avoid retain cycles
- [`kvc-notification-block-observer-token`](kvc-notification-block-observer-token.md) - Prefer block-based `NSNotificationCenter` observers and keep the removal token
- [`anti-retain-cycle-block-self`](anti-retain-cycle-block-self.md) - Don't capture `self` strongly in a block stored as a property
