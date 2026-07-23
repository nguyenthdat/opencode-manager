# null-avoid-id-when-concrete

> Avoid `id` when a concrete or protocol-qualified type is known

## Why It Matters

`id` disables the compiler's type checking entirely: any message send compiles against `id`, even a method the object doesn't implement, so typos and wrong-type mistakes turn into runtime `-[__NSDictionaryM stringByAppendingString:]: unrecognized selector` crashes instead of compile errors. Using the concrete class (or `id<Protocol>` when only conformance matters) restores autocomplete, compiler warnings, and correct Swift bridging.

## Bad

```objc
@interface OMWCartManager : NSObject
- (void)addItem:(id)item;              // Could be anything; no compiler help
- (id)totalPriceForItems:(id)items;    // Return type and parameter both untyped
@end

@implementation OMWCartManager

- (id)totalPriceForItems:(id)items {
    NSDecimalNumber *total = [NSDecimalNumber zero];
    for (id item in items) {
        total = [total decimalNumberByAdding:[item price]];  // Typo-prone: no autocomplete, no type check
    }
    return total;
}

@end
```

## Good

```objc
@interface OMWCartManager : NSObject
- (void)addItem:(OMWCartItem *)item;                                    // Concrete type
- (NSDecimalNumber *)totalPriceForItems:(NSArray<OMWCartItem *> *)items; // Concrete, generic-parameterized
@end

@implementation OMWCartManager

- (NSDecimalNumber *)totalPriceForItems:(NSArray<OMWCartItem *> *)items {
    NSDecimalNumber *total = [NSDecimalNumber zero];
    for (OMWCartItem *item in items) {
        total = [total decimalNumberByAdding:item.price];  // Compiler-checked, autocompletes correctly
    }
    return total;
}

@end
```

## When `id` Is Still the Right Choice

```objc
// Truly polymorphic collection APIs (NSArray's -containsObject:, KVC's
// -valueForKey:) genuinely accept "any object" and should stay `id`.
// The rule targets the common case where a concrete or protocol type is
// actually known but `id` was used out of habit or laziness.
- (BOOL)containsObject:(id)anObject;  // Correct: this is genuinely type-erased by design
```

## Prefer Protocol-Qualified `id` Over Bare `id` for Conformance

```objc
// If any object conforming to a protocol is acceptable, id<Protocol> keeps
// the flexibility while still checking the required methods exist:
- (void)setDataSource:(id<OMWCartDataSource>)dataSource;  // See null-protocol-qualified-id
```

## See Also

- [`null-protocol-qualified-id`](null-protocol-qualified-id.md) - Use `id<Protocol>` instead of bare `id` when conformance is required
- [`anti-unchecked-id-cast`](anti-unchecked-id-cast.md) - Don't cast `id` to a concrete type without an `isKindOfClass:` check
- [`null-lightweight-generics`](null-lightweight-generics.md) - Parameterize collections with lightweight generics
