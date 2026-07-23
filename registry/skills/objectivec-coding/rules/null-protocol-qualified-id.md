# null-protocol-qualified-id

> Use `id<Protocol>` instead of bare `id` when conformance is required

## Why It Matters

Bare `id` accepts any object and lets you message it with any known selector, whether or not the object actually implements it. `id<Protocol>` keeps the same flexibility to accept objects of any class, but restricts messaging to the protocol's declared methods and lets the compiler warn at the call site when an assigned object doesn't conform, catching integration mistakes long before they become an `unrecognized selector` crash at runtime.

## Bad

```objc
@interface OMWTableViewController : UIViewController
@property (nonatomic, weak) id dataSource;   // Any object at all - no conformance check
@end

@implementation OMWTableViewController

- (void)loadData {
    NSArray *items = [self.dataSource itemsForSection:0];  // Compiler can't verify this method exists
    // If dataSource happens to be some unrelated object without this method,
    // this compiles cleanly and crashes only when actually invoked at runtime.
}

@end
```

## Good

```objc
@protocol OMWTableViewDataSource <NSObject>
- (NSArray<OMWItem *> *)itemsForSection:(NSInteger)section;
- (NSInteger)numberOfSections;
@end

@interface OMWTableViewController : UIViewController
@property (nonatomic, weak) id<OMWTableViewDataSource> dataSource;  // Any class, but must conform
@end

@implementation OMWTableViewController

- (void)loadData {
    NSArray<OMWItem *> *items = [self.dataSource itemsForSection:0];  // Compiler verifies method exists
}

@end
```

## Assigning a Non-Conforming Object Warns at Compile Time

```objc
@interface OMWUnrelatedThing : NSObject
@end

OMWTableViewController *vc = [[OMWTableViewController alloc] init];
vc.dataSource = [[OMWUnrelatedThing alloc] init];
// Warning: "Assigning to 'id<OMWTableViewDataSource>' from incompatible type
// 'OMWUnrelatedThing *'" - caught before it ever ships.
```

## Combining Multiple Protocol Conformances

```objc
// An id can be qualified with multiple protocols when an API genuinely needs
// an object satisfying several small, composed protocols at once:
- (void)configureWithProvider:(id<OMWDataSource, OMWCacheInvalidating>)provider;
```

## See Also

- [`null-avoid-id-when-concrete`](null-avoid-id-when-concrete.md) - Avoid `id` when a concrete or protocol-qualified type is known
- [`api-compose-small-protocols`](api-compose-small-protocols.md) - Compose several small protocols instead of one monolithic protocol
- [`anti-unchecked-id-cast`](anti-unchecked-id-cast.md) - Don't cast `id` to a concrete type without an `isKindOfClass:` check
