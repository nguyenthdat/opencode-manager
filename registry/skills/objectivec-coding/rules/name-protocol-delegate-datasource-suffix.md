# name-protocol-delegate-datasource-suffix

> Suffix callback protocols with `Delegate`/`DataSource`

## Why It Matters

Cocoa splits callback protocols into two well-understood roles: a `Delegate` reacts to events and customizes behavior, while a `DataSource` supplies data on demand. Naming a protocol without one of these suffixes (or with an unrelated suffix) forces every adopter to read the whole protocol body just to figure out which role it plays, instead of recognizing the role instantly from the type name the way they already do for `UITableViewDelegate`/`UITableViewDataSource`.

## Bad

```objc
@protocol OMWCarouselViewCallbacks <NSObject>          // "Callbacks" doesn't say delegate or data source
- (void)carouselView:(OMWCarouselView *)view didSelectItemAtIndex:(NSUInteger)index;
@end

@protocol OMWCarouselViewProvider <NSObject>           // Ambiguous - provider of what, exactly?
- (NSUInteger)numberOfItemsInCarouselView:(OMWCarouselView *)view;
- (UIView *)carouselView:(OMWCarouselView *)view viewForItemAtIndex:(NSUInteger)index;
@end
```

## Good

```objc
@protocol OMWCarouselViewDelegate <NSObject>
@optional
- (void)carouselView:(OMWCarouselView *)view didSelectItemAtIndex:(NSUInteger)index;
- (void)carouselView:(OMWCarouselView *)view willScrollToIndex:(NSUInteger)index;
@end

@protocol OMWCarouselViewDataSource <NSObject>
@required
- (NSUInteger)numberOfItemsInCarouselView:(OMWCarouselView *)view;
- (UIView *)carouselView:(OMWCarouselView *)view viewForItemAtIndex:(NSUInteger)index;
@end
```

## Declaring the Corresponding Weak Delegate Property

```objc
@interface OMWCarouselView : UIView

@property (nonatomic, weak, nullable) id<OMWCarouselViewDelegate> delegate;
@property (nonatomic, weak, nullable) id<OMWCarouselViewDataSource> dataSource;

@end
```

## When Neither Suffix Fits: Use a Role-Specific Noun Instead

```objc
// Not every protocol is a delegate/data source pair - name it after its actual role instead,
// but still avoid a vague catch-all like "Handler" or "Callbacks".
@protocol OMWImageDecoding <NSObject>       // describes a capability, not a callback relationship
- (nullable UIImage *)decodeImageFromData:(NSData *)data;
@end

@protocol OMWCacheEviction <NSObject>       // describes a policy role
- (BOOL)shouldEvictObject:(id)object forKey:(NSString *)key;
@end
```

## See Also

- [`name-delegate-method-sender-first`](name-delegate-method-sender-first.md) - Pass the sender as the first argument of delegate callback methods
- [`api-delegate-protocol-pattern`](api-delegate-protocol-pattern.md) - Use a delegate protocol for customizable callbacks
- [`api-datasource-protocol-pattern`](api-datasource-protocol-pattern.md) - Use a data-source protocol to separate data supply from behavior
