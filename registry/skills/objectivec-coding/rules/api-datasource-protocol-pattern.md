# api-datasource-protocol-pattern

> Use a data-source protocol to separate data supply from behavior

## Why It Matters

Conflating "where does my data come from" with "how do I react to events" into a single protocol (or worse, a single delegate) forces every consumer to implement both concerns even when it only cares about one, and it prevents a view or controller from being reused with a different data provider. Splitting them, as `UITableViewDataSource`/`UITableViewDelegate` do, lets one object supply rows while a completely different object handles selection and layout customization.

## Bad

```objc
// One protocol mixes data supply with event handling - implementers of
// selection behavior are forced to also implement row-count/content methods.
@protocol OMWListControllerDelegate <NSObject>
- (NSInteger)numberOfItemsInList;
- (OMWListItem *)itemAtIndex:(NSInteger)index;
- (void)didSelectItemAtIndex:(NSInteger)index;
- (void)didDeleteItemAtIndex:(NSInteger)index;
@end
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

// Data source: answers "what data exists" - stateless, queryable
@protocol OMWListDataSource <NSObject>
- (NSInteger)numberOfItemsInList:(OMWListController *)list;
- (OMWListItem *)list:(OMWListController *)list itemAtIndex:(NSInteger)index;
@end

// Delegate: answers "what happened" - event-driven, ongoing callbacks
@protocol OMWListControllerDelegate <NSObject>
@optional
- (void)list:(OMWListController *)list didSelectItemAtIndex:(NSInteger)index;
- (void)list:(OMWListController *)list didDeleteItemAtIndex:(NSInteger)index;
@end

@interface OMWListController : NSObject

@property (nonatomic, weak, nullable) id<OMWListDataSource> dataSource;
@property (nonatomic, weak, nullable) id<OMWListControllerDelegate> delegate;

- (void)reloadData;

@end

NS_ASSUME_NONNULL_END

@implementation OMWListController

- (void)reloadData {
    NSInteger count = [self.dataSource numberOfItemsInList:self];
    for (NSInteger i = 0; i < count; i++) {
        OMWListItem *item = [self.dataSource list:self itemAtIndex:i];
        [self renderItem:item atIndex:i];
    }
}

- (void)userDidTapRowAtIndex:(NSInteger)index {
    if ([self.delegate respondsToSelector:@selector(list:didSelectItemAtIndex:)]) {
        [self.delegate list:self didSelectItemAtIndex:index];
    }
}

@end
```

## One Object Can Adopt Both, or Two Objects Can Split the Roles

```objc
// A view controller can act as both, when that's convenient...
@interface OMWTasksViewController : UIViewController <OMWListDataSource, OMWListControllerDelegate>
@end

// ...or a dedicated fetched-results provider can own only the data-source
// role, while the view controller owns only selection/deletion handling -
// this split is exactly what the two-protocol design enables.
@interface OMWCoreDataListProvider : NSObject <OMWListDataSource>
@end
```

## See Also

- [`api-delegate-protocol-pattern`](api-delegate-protocol-pattern.md) - The event-callback half of this split
- [`api-compose-small-protocols`](api-compose-small-protocols.md) - The general principle behind splitting one protocol into several
- [`name-protocol-delegate-datasource-suffix`](name-protocol-delegate-datasource-suffix.md) - Naming convention for both protocol kinds
