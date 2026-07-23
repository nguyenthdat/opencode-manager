# proj-import-vs-forward-declare

> Forward-declare with `@class`/`@protocol` in headers; `#import` in implementation files

## Why It Matters

`#import`ing a full header inside another header creates a real compile-time dependency that ripples outward: every file that imports your header now also transitively imports (and recompiles when) that other header changes, and two classes that `#import` each other's headers directly create a circular-include cycle that only "resolves" because of `#import`'s once-only semantics, silently hiding which one wins depending on include order. Forward-declaring the type with `@class`/`@protocol` gives the header enough information to compile (a pointer to an unknown-layout object) without pulling in the rest of that header's dependency graph.

## Bad

```objc
// OMWOrder.h
#import <Foundation/Foundation.h>
#import "OMWCustomer.h"   // Full header pulled into every file that
#import "OMWInvoice.h"    // imports OMWOrder.h, even though OMWOrder.h
                          // only needs pointer types here.

@interface OMWOrder : NSObject
@property (nonatomic, strong) OMWCustomer *customer;
@property (nonatomic, strong) OMWInvoice *invoice;
- (void)applyDiscountFromCustomer:(OMWCustomer *)customer;
@end
```

```objc
// OMWCustomer.h
#import "OMWOrder.h"   // Circular: OMWOrder.h imports OMWCustomer.h and
                        // vice versa. Works only by accident of include
                        // guards and import order; fragile in bigger graphs.
@interface OMWCustomer : NSObject
@property (nonatomic, strong) NSArray<OMWOrder *> *orderHistory;
@end
```

## Good

```objc
// OMWOrder.h
#import <Foundation/Foundation.h>

@class OMWCustomer, OMWInvoice;   // Forward declarations: enough for
                                   // pointer-typed properties/params.

NS_ASSUME_NONNULL_BEGIN

@interface OMWOrder : NSObject
@property (nonatomic, strong) OMWCustomer *customer;
@property (nonatomic, strong) OMWInvoice *invoice;
- (void)applyDiscountFromCustomer:(OMWCustomer *)customer;
@end

NS_ASSUME_NONNULL_END
```

```objc
// OMWOrder.m -- the implementation actually calls methods on
// OMWCustomer/OMWInvoice, so it needs the real headers here.
#import "OMWOrder.h"
#import "OMWCustomer.h"
#import "OMWInvoice.h"

@implementation OMWOrder

- (void)applyDiscountFromCustomer:(OMWCustomer *)customer {
    if (customer.isLoyaltyMember) {
        self.invoice.discountPercentage = 10;
    }
}

@end
```

## Forward-Declaring Protocols

```objc
// OMWDownloadTask.h
@protocol OMWDownloadTaskDelegate;   // Protocol forward declaration.

NS_ASSUME_NONNULL_BEGIN

@interface OMWDownloadTask : NSObject
@property (nonatomic, weak, nullable) id<OMWDownloadTaskDelegate> delegate;
@end

NS_ASSUME_NONNULL_END
```

## When a Header Import Is Required

```objc
// If a header declares a property or ivar of a struct/enum type (not a
// pointer), or subclasses a type, a real #import is required because
// the compiler needs the full definition, not just a forward declaration.
#import "OMWGeometry.h"   // Needed: OMWEdgeInsets is a C struct, not a
                          // pointer, so its full layout must be known.

@interface OMWLayoutGuide : NSObject
@property (nonatomic, assign) OMWEdgeInsets contentInsets;
@end
```

## See Also

- [`proj-header-implementation-split`](proj-header-implementation-split.md) - Split public interface (`.h`) from implementation (`.m`)
- [`proj-pch-minimal`](proj-pch-minimal.md) - Keep the precompiled prefix header minimal; avoid dumping every import into it
- [`anti-import-everything-header`](anti-import-everything-header.md) - Don't `#import` the world into one umbrella/prefix header
