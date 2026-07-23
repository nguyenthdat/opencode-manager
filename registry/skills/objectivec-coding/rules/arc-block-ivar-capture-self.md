# arc-block-ivar-capture-self

> Avoid implicit `self` capture via bare ivar access inside stored blocks

## Why It Matters

Referencing a bare ivar (`_name` instead of `self.name`) or calling an unqualified method inside a block still implicitly captures `self` strongly - the compiler desugars `_name` to `self->_name`, which needs `self` to be alive. Developers who add `__weak self` to fix a retain cycle often miss this because there's no visible `self.` token to remind them, so the block keeps a hidden strong capture and the cycle they thought they fixed is still there.

## Bad

```objc
@interface OMWChatController ()
@property (nonatomic, copy) void (^messageHandler)(NSString *text);
@end

@implementation OMWChatController {
    NSMutableArray<NSString *> *_messages;  // Backing ivar
}

- (void)setUp {
    __weak __typeof__(self) weakSelf = self;
    self.messageHandler = ^(NSString *text) {
        __strong __typeof__(self) strongSelf = weakSelf;
        if (!strongSelf) return;
        [_messages addObject:text];   // BUG: bare ivar access implicitly uses `self`, not `strongSelf`!
        // This desugars to [self->_messages addObject:text], silently
        // capturing `self` strongly and recreating the retain cycle the
        // weak/strong dance above was supposed to prevent.
    };
}

@end
```

## Good

```objc
@interface OMWChatController ()
@property (nonatomic, copy) void (^messageHandler)(NSString *text);
@end

@implementation OMWChatController {
    NSMutableArray<NSString *> *_messages;
}

- (void)setUp {
    __weak __typeof__(self) weakSelf = self;
    self.messageHandler = ^(NSString *text) {
        __strong __typeof__(self) strongSelf = weakSelf;
        if (!strongSelf) return;
        [strongSelf->_messages addObject:text];  // Explicitly routes through strongSelf, no hidden capture
    };
}

@end
```

## Same Trap With Unqualified Method Calls

```objc
// [self doSomething] and just doSomething (implicit self) both capture self
// strongly the same way a bare ivar does:
self.completionHandler = ^{
    __strong __typeof__(self) strongSelf = weakSelf;
    if (!strongSelf) return;
    [self logCompletion];          // BUG: still `self`, not `strongSelf` - hidden strong capture
    [strongSelf logCompletion];    // Correct: routes through the already-strengthened reference
};
```

## Catching This With the Static Analyzer / clang-tidy

```objc
// Xcode's "-Wimplicit-retain-self" adjacent checks and clang-tidy's
// objc-avoid-retain-cycle rule can flag bare `self`/ivar captures inside
// blocks that also declare a __weak self alongside them - enable these in CI
// rather than relying on manual review to catch every instance.
```

## See Also

- [`arc-weak-strong-self`](arc-weak-strong-self.md) - Capture `__weak self` then re-strengthen inside blocks to avoid retain cycles
- [`anti-retain-cycle-block-self`](anti-retain-cycle-block-self.md) - Don't capture `self` strongly in a block stored as a property
- [`lint-clang-static-analyzer-ci`](lint-clang-static-analyzer-ci.md) - Run the Clang Static Analyzer in CI
