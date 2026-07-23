# null-kindof-covariant-return

> Use `__kindof` for covariant factory/collection return types

## Why It Matters

Lightweight generics are invariant: a method typed to return `NSArray<OMWView *> *` cannot be assigned to `NSArray<OMWButton *> *` even though `OMWButton` is a subclass of `OMWView`, and a factory method whose actual runtime type varies by subclass (like `+[UIStoryboard instantiateViewControllerWithIdentifier:]`) still needs a single static return type. `__kindof T` tells the compiler "the actual type is T or some subclass of T," letting callers assign into a more specific local variable without a manual cast, while still catching assignments to unrelated types.

## Bad

```objc
@interface OMWViewFactory : NSObject
+ (UIView *)viewForIdentifier:(NSString *)identifier;  // Always statically typed as plain UIView
@end

// Elsewhere:
OMWCustomButton *button = (OMWCustomButton *)[OMWViewFactory viewForIdentifier:@"submit"];
// Requires an explicit, unchecked cast every time, even though the factory
// is documented to return an OMWCustomButton for this particular identifier.
```

## Good

```objc
@interface OMWViewFactory : NSObject
+ (__kindof UIView *)viewForIdentifier:(NSString *)identifier;  // "UIView or some subclass of it"
@end

// Elsewhere:
OMWCustomButton *button = [OMWViewFactory viewForIdentifier:@"submit"];
// No cast needed: the compiler allows assigning a __kindof UIView* result
// into any UIView subclass variable, while still warning if you assign it
// to something unrelated (e.g. NSString*).
```

## `__kindof` on Collection Element Types

```objc
// Used heavily in UIKit/AppKit for heterogeneous-but-related collections:
@property (nonatomic, copy, readonly) NSArray<__kindof UIView *> *subviews;

for (__kindof UIView *subview in tableView.subviews) {
    if ([subview isKindOfClass:[UILabel class]]) {
        UILabel *label = (UILabel *)subview;  // Still needs a runtime check + cast for the specific type
        label.text = @"Updated";
    }
}
```

## `__kindof` Does Not Replace a Runtime Check

```objc
// __kindof only affects static typing convenience; it provides zero runtime
// guarantee. Any code that needs to be sure of the concrete subclass still
// must use isKindOfClass: before calling subclass-specific methods:
__kindof UIViewController *vc = [storyboard instantiateViewControllerWithIdentifier:@"detail"];
if ([vc isKindOfClass:[OMWDetailViewController class]]) {
    OMWDetailViewController *detailVC = (OMWDetailViewController *)vc;
    detailVC.itemID = @"42";
}
```

## See Also

- [`null-lightweight-generics`](null-lightweight-generics.md) - Parameterize collections with lightweight generics
- [`null-generic-mutable-subclass`](null-generic-mutable-subclass.md) - Preserve declared generics on mutable collection subclass return types
- [`anti-unchecked-id-cast`](anti-unchecked-id-cast.md) - Don't cast `id` to a concrete type without an `isKindOfClass:` check
