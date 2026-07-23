# api-property-attribute-discipline

> Choose `atomic`/`nonatomic`, `strong`/`copy`/`weak`, `readonly`/`readwrite` deliberately

## Why It Matters

Every property attribute is a promise: `atomic` promises safe (but not free) concurrent access to the single property access, `strong`/`weak`/`copy` promise a specific ownership and mutability contract, and `readonly` promises callers can't reassign it. Picking attributes by habit or copy-paste rather than by what the property actually needs produces subtle bugs — a mutable `NSString` silently changing out from under you without `copy`, a retain cycle from a `strong` delegate, or false confidence in thread safety from `atomic` on a property that's actually mutated from multiple threads without any other synchronization.

## Bad

```objc
@interface OMWSession : NSObject

@property (atomic, strong) NSString *token;         // atomic ⇒ false sense of thread safety; also should be `copy`
@property (nonatomic, strong) id<OMWSessionDelegate> delegate;  // strong delegate ⇒ retain cycle risk
@property (nonatomic, strong) NSArray *scopes;       // should be `copy`: caller's mutable array could change under us
@property (nonatomic, readwrite) NSDate *expiresAt;  // publicly settable when it should only be set internally

@end

// Caller can mutate what was supposed to be an immutable snapshot
NSMutableArray *scopes = [@[@"read", @"write"] mutableCopy];
session.scopes = scopes;
[scopes addObject:@"admin"];  // session.scopes silently changed too, since `strong` just retains the same object
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

@interface OMWSession : NSObject

@property (nonatomic, copy) NSString *token;               // nonatomic: no real cross-thread access; copy: value semantics
@property (nonatomic, weak, nullable) id<OMWSessionDelegate> delegate;  // weak: avoids owner retain cycle
@property (nonatomic, copy) NSArray<NSString *> *scopes;    // copy: immune to caller mutating their array afterward
@property (nonatomic, readonly) NSDate *expiresAt;          // readonly publicly; see api-readonly-public-readwrite-private

@end

NS_ASSUME_NONNULL_END

// Now mutating the caller's original array has no effect on the stored copy
NSMutableArray<NSString *> *scopes = [@[@"read", @"write"] mutableCopy];
session.scopes = scopes;      // -copy is invoked by the synthesized setter
[scopes addObject:@"admin"];  // session.scopes is untouched - it holds its own immutable copy
```

## The Decision Table

```objc
// atomic vs nonatomic
//   nonatomic (default choice): no unsynchronized cross-thread access, or
//     access is already protected by other means (a serial queue, a lock).
//   atomic: only makes a SINGLE property access atomic - it does not make
//     compound operations (read-modify-write) thread-safe. Rarely sufficient
//     on its own; prefer explicit synchronization instead (see conc- rules).

// strong vs copy vs weak
//   strong: default for objects you own and don't need value semantics for.
//   copy: NSString/NSArray/NSDictionary/block-typed properties - protects
//     against caller-side mutation of a passed-in mutable instance.
//   weak: back-references, delegates, and anything that must not keep its
//     owner alive.

// readonly vs readwrite
//   readonly (public) + readwrite (redeclared in a private class extension):
//     the standard pattern for state a class manages, but callers shouldn't
//     directly assign.
```

## See Also

- [`arc-copy-value-objects`](arc-copy-value-objects.md) - The `copy` rule for value-object properties in depth
- [`arc-weak-delegate`](arc-weak-delegate.md) - Why delegate properties must be `weak`
- [`api-readonly-public-readwrite-private`](api-readonly-public-readwrite-private.md) - The readonly/readwrite split pattern
