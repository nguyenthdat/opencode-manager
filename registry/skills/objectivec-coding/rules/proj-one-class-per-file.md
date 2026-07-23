# proj-one-class-per-file

> Keep one primary class per file, named to match

## Why It Matters

Xcode, `grep`, and `Cmd+Shift+O` all assume `OMWUser.h`/`OMWUser.m` contains `OMWUser`. Stuffing several unrelated classes into one file breaks that assumption, makes diffs noisy (an unrelated class's change shows up in every file that "happens" to also define the class you're touching), and forces every importer to pull in classes it doesn't need since there's no way to `#import` just one of several classes from the same file.

## Bad

```objc
// OMWModels.m -- three unrelated classes crammed into one file.
#import "OMWModels.h"

@implementation OMWUser
- (instancetype)initWithName:(NSString *)name {
    if (self = [super init]) {
        _name = [name copy];
    }
    return self;
}
@end

@implementation OMWOrder
- (instancetype)initWithItems:(NSArray<OMWItem *> *)items {
    if (self = [super init]) {
        _items = [items copy];
    }
    return self;
}
@end

@implementation OMWItem
// Touching OMWItem forces a diff review of OMWUser and OMWOrder too,
// and anyone who imports OMWModels.h to use OMWItem drags in OMWUser
// and OMWOrder's interfaces as well.
- (instancetype)initWithSKU:(NSString *)sku price:(NSDecimalNumber *)price {
    if (self = [super init]) {
        _sku = [sku copy];
        _price = price;
    }
    return self;
}
@end
```

## Good

```objc
// OMWUser.h / OMWUser.m
@interface OMWUser : NSObject
- (instancetype)initWithName:(NSString *)name;
@end
```

```objc
// OMWOrder.h / OMWOrder.m
@interface OMWOrder : NSObject
- (instancetype)initWithItems:(NSArray<OMWItem *> *)items;
@end
```

```objc
// OMWItem.h / OMWItem.m
@interface OMWItem : NSObject
- (instancetype)initWithSKU:(NSString *)sku price:(NSDecimalNumber *)price;
@end
```

## When a Small Private Helper Class Is Acceptable in the Same File

```objc
// OMWOrder.m
#import "OMWOrder.h"

// A tiny, private-only helper used exclusively to implement OMWOrder
// and never exposed in any header can reasonably live alongside it,
// since it has no independent identity outside this file.
@interface OMWOrderLineItemDiff : NSObject
@property (nonatomic, copy) NSString *sku;
@property (nonatomic, assign) NSInteger quantityDelta;
@end

@implementation OMWOrderLineItemDiff
@end

@implementation OMWOrder
// ...
@end
```

## See Also

- [`proj-header-implementation-split`](proj-header-implementation-split.md) - Split public interface (`.h`) from implementation (`.m`)
- [`proj-group-by-feature-not-type`](proj-group-by-feature-not-type.md) - Organize files by feature/module, not by type (all-models, all-views)
- [`api-single-responsibility-class`](api-single-responsibility-class.md) - Keep each class focused on one responsibility
