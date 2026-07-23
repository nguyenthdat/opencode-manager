# arc-weak-over-unsafe-unretained

> Prefer `weak` over `unsafe_unretained` for nullable back-references

## Why It Matters

Both qualifiers give you a non-owning reference, but `weak` is tracked by the ARC runtime's zeroing-weak-reference tables: when the referenced object deallocates, every `weak` pointer to it is automatically set to `nil`. `unsafe_unretained` gets none of that; the pointer keeps its old bit pattern after the target is freed, so any later message send is undefined behavior on a dangling pointer. For any nullable, non-owning back-reference (parent, cache owner, delegate), `weak` gives you crash-free safety essentially for free.

## Bad

```objc
@interface OMWCarouselCell : UICollectionViewCell
@property (nonatomic, unsafe_unretained) OMWCarouselViewController *parentController;  // Dangles if freed
@end

@implementation OMWCarouselCell

- (void)configureWithParent:(OMWCarouselViewController *)parent {
    self.parentController = parent;
}

- (void)didSelectItem {
    // If parentController's owner already deallocated (e.g. user backed out
    // quickly while a reused cell is still queued for an action), this is a
    // dangling-pointer crash instead of a harmless no-op.
    [self.parentController carouselCellDidSelect:self];
}

@end
```

## Good

```objc
@interface OMWCarouselCell : UICollectionViewCell
@property (nonatomic, weak) OMWCarouselViewController *parentController;  // Auto-nils on dealloc
@end

@implementation OMWCarouselCell

- (void)configureWithParent:(OMWCarouselViewController *)parent {
    self.parentController = parent;
}

- (void)didSelectItem {
    [self.parentController carouselCellDidSelect:self];  // Safely becomes a no-op if parent is gone
}

@end
```

## Checking Nil Explicitly When Behavior Differs on Absence

```objc
- (void)didSelectItem {
    OMWCarouselViewController *parent = self.parentController;  // Strong-local snapshot avoids races
    if (parent == nil) {
        return;  // Parent already gone; nothing meaningful to do
    }
    [parent carouselCellDidSelect:self];
}
```

## The Narrow Case Where `unsafe_unretained` Remains Necessary

```objc
// Weak references require the referenced class to support zeroing weak refs.
// A handful of legacy or root classes (e.g. some NSProxy subclasses) don't.
// Only in that specific, documented situation is unsafe_unretained justified -
// see arc-unsafe-unretained-rare for the full guidance and mitigation pattern.
```

## See Also

- [`arc-unsafe-unretained-rare`](arc-unsafe-unretained-rare.md) - Reserve `unsafe_unretained` for rare non-`weak`-compatible cases
- [`arc-weak-delegate`](arc-weak-delegate.md) - Declare delegate properties `weak` to avoid owner retain cycles
- [`arc-timer-target-cycle`](arc-timer-target-cycle.md) - Avoid `NSTimer`/`CADisplayLink` strong-target retain cycles
