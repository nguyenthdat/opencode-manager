# anti-mutable-public-property

> Don't expose a mutable (`NSMutableArray *`) property directly on a public interface

## Why It Matters

Exposing `NSMutableArray *`/`NSMutableDictionary *` directly means any consumer holding a reference can mutate your object's internal state without going through any accessor, invalidating whatever invariants your class was supposed to maintain — and worse, if any other code (including your own) is iterating that same mutable collection at the time, mutating it out from under the enumerator throws `NSGenericException: *** Collection <NSMutableArray> was mutated while being enumerated`. It also silently defeats KVO: mutating a mutable collection in place through a getter doesn't trigger `willChangeValueForKey:`/`didChangeValueForKey:`, so observers never find out.

## Bad

```objc
// OMWShoppingCart.h
@interface OMWShoppingCart : NSObject
@property (nonatomic, strong) NSMutableArray<OMWCartItem *> *items;
@end
```

```objc
// Any consumer can mutate the cart's items directly, bypassing any
// validation (e.g. quantity limits, duplicate detection) OMWShoppingCart
// was meant to enforce, and while OMWShoppingCart is fast-enumerating
// items internally, a caller can crash the app by mutating the same
// array concurrently.
OMWShoppingCart *cart = [self currentCart];
[cart.items removeAllObjects];       // No validation, no notification.
[cart.items addObject:freeItem];      // Bypasses price/quantity checks.
```

## Good

```objc
// OMWShoppingCart.h -- expose an immutable, copied snapshot; mutation
// only happens through methods that can enforce invariants and post
// change notifications.
NS_ASSUME_NONNULL_BEGIN

@interface OMWShoppingCart : NSObject

@property (nonatomic, copy, readonly) NSArray<OMWCartItem *> *items;

- (void)addItem:(OMWCartItem *)item;
- (void)removeItemWithSKU:(NSString *)sku;

@end

NS_ASSUME_NONNULL_END
```

```objc
// OMWShoppingCart.m
@interface OMWShoppingCart ()
@property (nonatomic, strong) NSMutableArray<OMWCartItem *> *mutableItems;
@end

@implementation OMWShoppingCart

- (NSArray<OMWCartItem *> *)items {
    return [self.mutableItems copy];   // Snapshot; safe to enumerate
                                          // even while the cart mutates
                                          // concurrently.
}

- (void)addItem:(OMWCartItem *)item {
    if ([self quantityForSKU:item.sku] >= kOMWMaxItemQuantity) {
        return;   // Invariant enforced here, impossible to bypass.
    }
    [self.mutableItems addObject:item];
    [[NSNotificationCenter defaultCenter] postNotificationName:OMWCartDidChangeNotification
                                                          object:self];
}

@end
```

## See Also

- [`api-readonly-public-readwrite-private`](api-readonly-public-readwrite-private.md) - Expose `readonly` publicly, redeclare `readwrite` in a private extension
- [`api-mutable-immutable-pair`](api-mutable-immutable-pair.md) - Provide an immutable base class plus a mutable subclass, mirroring `NSString`/`NSMutableString`
- [`kvc-snapshot-before-mutation-iterate`](kvc-snapshot-before-mutation-iterate.md) - Copy a collection before iterating it while it may be mutated
