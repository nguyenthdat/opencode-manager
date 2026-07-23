# conc-main-queue-ui-updates

> Always dispatch UI updates back to the main queue

## Why It Matters

UIKit and AppKit are not thread-safe; touching a view, layer, or control from a background thread produces undefined behavior ranging from silent visual glitches to outright crashes (`UIView` assertion failures, `CALayer` corruption). Because the failure is timing-dependent, it often passes casual testing and then crashes intermittently in the field, which makes it expensive to diagnose after the fact.

## Bad

```objc
- (void)fetchUserAndUpdateLabel:(NSString *)userID {
    [self.networkClient fetchUserWithID:userID completion:^(OMWUser *_Nullable user, NSError *_Nullable error) {
        // completion runs on a background queue, but this mutates the UI directly.
        self.nameLabel.text = user.displayName;   // Crash risk / visual corruption.
        [self.activityIndicator stopAnimating];   // Also unsafe off the main thread.
    }];
}

- (void)downloadThumbnail:(NSURL *)url {
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{
        NSData *data = [NSData dataWithContentsOfURL:url];
        UIImage *image = [UIImage imageWithData:data];
        self.thumbnailView.image = image; // Still on the background queue here.
    });
}
```

## Good

```objc
- (void)fetchUserAndUpdateLabel:(NSString *)userID {
    [self.networkClient fetchUserWithID:userID completion:^(OMWUser *_Nullable user, NSError *_Nullable error) {
        dispatch_async(dispatch_get_main_queue(), ^{
            self.nameLabel.text = user.displayName;
            [self.activityIndicator stopAnimating];
        });
    }];
}

- (void)downloadThumbnail:(NSURL *)url {
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{
        NSData *data = [NSData dataWithContentsOfURL:url];
        UIImage *image = [UIImage imageWithData:data];
        dispatch_async(dispatch_get_main_queue(), ^{
            self.thumbnailView.image = image;
        });
    });
}
```

## Guarding Against Redundant Main-Queue Hops

```objc
// If a method may be called from either thread, check first rather than
// unconditionally hopping - avoids an unnecessary async round-trip when
// already on the main queue, without ever running UI code off it.
- (void)updateStatusText:(NSString *)text {
    if (NSThread.isMainThread) {
        self.statusLabel.text = text;
        return;
    }
    dispatch_async(dispatch_get_main_queue(), ^{
        self.statusLabel.text = text;
    });
}
```

## Main Thread Checker

Xcode's Main Thread Checker (enabled by default in the scheme's Diagnostics) instruments UIKit calls at runtime and halts the debugger the moment a UI method executes off the main thread - keep it enabled in every debug scheme rather than relying on manual review to catch this class of bug.

## See Also

- [`conc-avoid-blocking-main-thread`](conc-avoid-blocking-main-thread.md) - Never perform synchronous network/disk I/O on the main thread
- [`conc-completion-handler-single-call`](conc-completion-handler-single-call.md) - Guarantee a completion handler is invoked exactly once on every path
- [`err-completion-block-error-convention`](err-completion-block-error-convention.md) - Put the error argument last in completion blocks; nil result on failure
