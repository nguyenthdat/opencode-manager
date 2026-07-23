# anti-retain-cycle-block-self

> Don't capture `self` strongly in a block stored as a property

## Why It Matters

Under ARC, a block captures any Objective-C object it references by strong reference by default. If that block is then stored as a property on `self` (directly, or indirectly through another object `self` owns), you've created `self -> block -> self`, a reference cycle that ARC's automatic reference counting can never break on its own. The object leaks for the lifetime of the app; it never reaches `dealloc`, so KVO observers are never removed, timers never invalidated, and network callbacks keep firing into a "zombie" object the rest of your code believes is gone.

## Bad

```objc
// OMWDownloadTask.h
@interface OMWDownloadTask : NSObject
@property (nonatomic, copy) void (^completionHandler)(NSData *data);
- (void)start;
@end
```

```objc
// OMWDownloadTask.m
@implementation OMWDownloadTask

- (void)start {
    // self.completionHandler is a property on self. The block below
    // captures self strongly (via self.progressLabel, an implicit
    // self access), so self now strongly retains a block that
    // strongly retains self: a cycle that never breaks.
    self.completionHandler = ^(NSData *data) {
        self.progressLabel.text = @"Done";
        [self processData:data];
    };
    [self.session dataTaskWithCompletionHandler:^(NSData *data, NSURLResponse *r, NSError *e) {
        self.completionHandler(data);
    }];
}

@end
```

## Good

```objc
@implementation OMWDownloadTask

- (void)start {
    __weak typeof(self) weakSelf = self;
    self.completionHandler = ^(NSData *data) {
        __strong typeof(self) strongSelf = weakSelf;
        if (strongSelf == nil) {
            return;
        }
        strongSelf.progressLabel.text = @"Done";
        [strongSelf processData:data];
    };
    [self.session dataTaskWithCompletionHandler:^(NSData *data, NSURLResponse *r, NSError *e) {
        self.completionHandler(data);
    }];
}

@end
```

## Why This Happens

The cycle is easy to introduce because nothing about the syntax looks dangerous — `self.foo = ^{ ... self ... };` reads like an ordinary property assignment. The danger is specifically the combination of (1) the block being stored somewhere `self` (transitively) owns, and (2) the block capturing `self` strongly. A block passed as a one-shot argument and not retained anywhere (e.g. `[UIView animateWithDuration:animations:^{ self.alpha = 0; }]`) does not cycle, because `UIView` doesn't hand that block back to `self` to hold onto.

## Detecting Existing Cycles

```objc
// A quick sanity check: add a dealloc log and confirm it fires after
// the owning object should have gone out of scope. If it never logs,
// something is retaining the object past its expected lifetime.
- (void)dealloc {
    NSLog(@"%@ deallocated", NSStringFromClass([self class]));
}
```

## See Also

- [`arc-weak-strong-self`](arc-weak-strong-self.md) - Capture `__weak self` then re-strengthen inside blocks to avoid retain cycles
- [`arc-copy-block-property`](arc-copy-block-property.md) - Use `copy` for block-typed properties
- [`arc-block-ivar-capture-self`](arc-block-ivar-capture-self.md) - Avoid implicit `self` capture via bare ivar access inside stored blocks
