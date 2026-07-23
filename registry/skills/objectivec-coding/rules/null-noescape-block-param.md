# null-noescape-block-param

> Annotate non-escaping block parameters with `NS_NOESCAPE`

## Why It Matters

A block parameter that's only invoked synchronously within the method call, and never stored past the call's return, is "non-escaping." Marking it `NS_NOESCAPE` tells the compiler (and Swift, which maps it directly to Swift's own `@noescape`-by-default closure semantics) that the block doesn't need to be captured on the heap for later use, allowing Swift callers to pass a stack closure without ARC forcing a heap copy, and documenting the contract clearly for Objective-C callers who might otherwise wonder if it's safe to reference stack-only state inside the block.

## Bad

```objc
@interface OMWCollectionValidator : NSObject

// No annotation: callers (especially from Swift) have to assume this block
// might be stored and called later, so Swift wraps it as an escaping closure
// and may force an unnecessary heap allocation for the closure context.
- (BOOL)validateItems:(NSArray<OMWItem *> *)items
        usingPredicate:(BOOL (^)(OMWItem *item))predicate;

@end
```

## Good

```objc
@interface OMWCollectionValidator : NSObject

- (BOOL)validateItems:(NSArray<OMWItem *> *)items
        usingPredicate:(BOOL (^)(OMWItem *item))predicate NS_NOESCAPE;

@end

@implementation OMWCollectionValidator

- (BOOL)validateItems:(NSArray<OMWItem *> *)items
        usingPredicate:(BOOL (^)(OMWItem *item))predicate {
    for (OMWItem *item in items) {
        if (!predicate(item)) {  // Called synchronously, never stored - matches the NS_NOESCAPE contract
            return NO;
        }
    }
    return YES;
}

@end
```

## Swift Call-Site Effect

```objc
// With NS_NOESCAPE annotated in the header, Swift imports the parameter as a
// non-escaping closure, matching Swift's own default and avoiding a forced
// heap allocation:
// func validateItems(_ items: [OMWItem], usingPredicate predicate: (OMWItem) -> Bool) -> Bool
// Without it, Swift must import as @escaping, adding overhead and requiring
// callers to capture `self` explicitly even for simple synchronous use.
```

## Don't Annotate Blocks That Actually Escape

```objc
// Never mark NS_NOESCAPE on a block that's stored, dispatched asynchronously,
// or invoked after the method returns - doing so is undefined behavior if the
// block captures stack-only state that's gone by the time it's called:
- (void)fetchDataWithCompletion:(void (^)(NSData *data))completion {
    dispatch_async(self.queue, ^{
        completion(...);  // Escapes past the call; must NOT be NS_NOESCAPE
    });
}
```

## See Also

- [`arc-copy-block-property`](arc-copy-block-property.md) - Use `copy` for block-typed properties
- [`interop-nullability-drives-optionals`](interop-nullability-drives-optionals.md) - Use accurate nullability annotations since they determine Swift `Optional` bridging
- [`conc-completion-handler-single-call`](conc-completion-handler-single-call.md) - Guarantee a completion handler is invoked exactly once on every path
