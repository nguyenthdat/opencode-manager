# arc-unsafe-unretained-rare

> Reserve `unsafe_unretained` for rare non-`weak`-compatible cases

## Why It Matters

`unsafe_unretained` behaves like a raw pointer: it does not retain its target, and unlike `weak` it is never zeroed when the target deallocates. If the referenced object is freed while an `unsafe_unretained` reference still points at it, that reference becomes a dangling pointer, and the next message send is undefined behavior (usually a crash, sometimes silent corruption). `weak` gives you the same non-owning semantics safely by automatically nilling out on deallocation, so it should always be preferred unless the target genuinely does not support weak references.

## Bad

```objc
@interface OMWTableViewCell : UITableViewCell
@property (nonatomic, unsafe_unretained) OMWTableViewController *ownerController;  // Should be weak
@end

// If ownerController deallocates before this cell (e.g. view controller popped
// while a cell's action is still queued on a runloop), the next access is a
// dangling-pointer crash instead of a graceful nil:
- (void)didTapButton {
    [self.ownerController handleCellTap:self];  // Crash if ownerController already deallocated
}
```

## Good

```objc
@interface OMWTableViewCell : UITableViewCell
@property (nonatomic, weak) OMWTableViewController *ownerController;  // Zeroed safely on dealloc
@end

- (void)didTapButton {
    [self.ownerController handleCellTap:self];  // No-op if ownerController is nil; no crash
}
```

## When `unsafe_unretained` Is Actually Required

```objc
// Some legacy classes predating ARC's weak-reference support (or certain
// proxy/root classes) don't support __weak. In those rare cases,
// unsafe_unretained is the only option:
@interface OMWLegacyPlugin : NSProxy  // NSProxy subclasses historically don't support weak
@end

@interface OMWPluginHost : NSObject
@property (nonatomic, unsafe_unretained) OMWLegacyPlugin *activePlugin;  // No weak-compatible target
@end

// Document *why* whenever you reach for this:
// unsafe_unretained: OMWLegacyPlugin is an NSProxy subclass; __weak is unsupported here.
```

## Guarding Manually When Forced to Use It

```objc
// If you must use unsafe_unretained, explicitly nil the reference out
// yourself at the point where the target's lifetime ends, rather than
// relying on automatic zeroing that unsafe_unretained does not provide:
- (void)pluginWillUnload:(OMWLegacyPlugin *)plugin {
    if (self.activePlugin == plugin) {
        self.activePlugin = nil;  // Manual nil-out since ARC won't do it for us
    }
}
```

## See Also

- [`arc-weak-over-unsafe-unretained`](arc-weak-over-unsafe-unretained.md) - Prefer `weak` over `unsafe_unretained` for nullable back-references
- [`arc-weak-delegate`](arc-weak-delegate.md) - Declare delegate properties `weak` to avoid owner retain cycles
- [`arc-timer-target-cycle`](arc-timer-target-cycle.md) - Avoid `NSTimer`/`CADisplayLink` strong-target retain cycles
