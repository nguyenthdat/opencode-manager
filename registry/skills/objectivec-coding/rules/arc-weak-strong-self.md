# arc-weak-strong-self

> Capture `__weak self` then re-strengthen inside blocks to avoid retain cycles

## Why It Matters

A block that captures `self` strongly, and is itself stored (directly or transitively) as a property of `self`, forms a retain cycle: `self` retains the block, the block retains `self`. Neither ever reaches a zero retain count, so `dealloc` never runs, leaking the entire object graph. Capturing `__weak self` and re-strengthening it at the top of the block breaks the cycle while still guaranteeing a consistent, non-nil `self` for the block's duration.

## Bad

```objc
@interface OMWImageLoader ()
@property (nonatomic, copy) void (^completionHandler)(UIImage *image);
@property (nonatomic, strong) NSURLSessionTask *task;
@end

@implementation OMWImageLoader

- (void)loadImageAtURL:(NSURL *)url {
    self.completionHandler = ^(UIImage *image) {
        self.task = nil;             // Strong capture of self via implicit `self.`
        [self displayImage:image];   // self is retained for the block's lifetime
    };
    // self -> completionHandler block -> self : retain cycle, OMWImageLoader never deallocs
}

@end
```

## Good

```objc
@interface OMWImageLoader ()
@property (nonatomic, copy) void (^completionHandler)(UIImage *image);
@property (nonatomic, strong) NSURLSessionTask *task;
@end

@implementation OMWImageLoader

- (void)loadImageAtURL:(NSURL *)url {
    __weak __typeof__(self) weakSelf = self;
    self.completionHandler = ^(UIImage *image) {
        __strong __typeof__(self) strongSelf = weakSelf;
        if (strongSelf == nil) {
            return;  // Loader was deallocated before the block ran; bail out safely
        }
        strongSelf.task = nil;
        [strongSelf displayImage:image];
    };
}

@end
```

## When Strong Self Capture Is Acceptable

```objc
// A one-shot, non-stored block passed straight to a method (e.g. dispatch_async,
// UIView animation, or a completion block that the receiver does not retain
// past its own lifetime) does not create a cycle, because nothing owned by
// self is holding onto the block.
- (void)refreshBadgeCount {
    dispatch_async(dispatch_get_main_queue(), ^{
        self.badgeLabel.text = @(self.unreadCount).stringValue;  // Fine: block isn't stored anywhere
    });
}
```

## Guarding Against Races Mid-Block

```objc
// Re-check strongSelf again after any async hop inside the same block,
// since weakSelf can turn nil between the first and second use.
self.completionHandler = ^(UIImage *image) {
    __strong __typeof__(self) strongSelf = weakSelf;
    if (!strongSelf) return;
    [strongSelf.networkQueue addOperationWithBlock:^{
        __strong __typeof__(self) strongSelfInner = weakSelf;  // Re-strengthen again
        if (!strongSelfInner) return;
        [strongSelfInner processImage:image];
    }];
};
```

## See Also

- [`arc-block-ivar-capture-self`](arc-block-ivar-capture-self.md) - Avoid implicit `self` capture via bare ivar access inside stored blocks
- [`arc-copy-block-property`](arc-copy-block-property.md) - Use `copy` for block-typed properties
- [`anti-retain-cycle-block-self`](anti-retain-cycle-block-self.md) - Don't capture `self` strongly in a block stored as a property
- [`conc-completion-handler-single-call`](conc-completion-handler-single-call.md) - Guarantee a completion handler is invoked exactly once on every path
