# anti-nsnumber-primitive-obsession

> Don't stringify/box everything into `NSNumber`/`NSString` instead of real types

## Why It Matters

Boxing every value into `NSNumber` or `NSString` throws away the type checking the compiler could otherwise give you: a currency amount, a user ID, and a percentage can all be represented as `NSNumber *`, and nothing stops you from passing one where another was expected — the compiler happily accepts it since they're all the same type. It also costs real performance (heap allocation and reference counting for what should be a stack value) and pushes conversion logic (`.integerValue`, `.doubleValue`, parsing back out of a string) to every call site instead of centralizing it in one type's initializer.

## Bad

```objc
// Every distinct concept -- a user ID, a price, a percentage discount,
// a flag -- is boxed into the same two types. Nothing stops you from
// passing a discount where a price was expected; the compiler sees
// NSNumber * either way.
@interface OMWOrderLine : NSObject
@property (nonatomic, strong) NSNumber *userID;          // Really an integer identifier.
@property (nonatomic, strong) NSNumber *priceInCents;     // Really a currency amount.
@property (nonatomic, strong) NSNumber *discountPercent;  // Really a bounded percentage.
@property (nonatomic, copy) NSString *isGiftWrapped;      // Really a BOOL, stringified
                                                            // as @"true"/@"false".
@end

- (NSNumber *)totalForLine:(OMWOrderLine *)line {
    // Silently compiles even though this swaps price and discount --
    // both are just NSNumber, so nothing catches the mistake.
    return @(line.discountPercent.doubleValue * (1.0 - line.priceInCents.doubleValue));
}
```

## Good

```objc
// Distinct concepts get distinct types, so the compiler enforces the
// difference between a price, a percentage, and an identifier.
typedef NS_ENUM(NSInteger, OMWGiftWrapOption) {
    OMWGiftWrapOptionNone,
    OMWGiftWrapOptionStandard,
    OMWGiftWrapOptionPremium,
};

@interface OMWOrderLine : NSObject
@property (nonatomic, assign) NSInteger userID;
@property (nonatomic, strong) NSDecimalNumber *price;
@property (nonatomic, assign) double discountPercent;   // 0.0...1.0, documented range.
@property (nonatomic, assign) OMWGiftWrapOption giftWrapOption;
@end

- (NSDecimalNumber *)totalForLine:(OMWOrderLine *)line {
    // Swapping .price and .discountPercent here would now be a compile
    // error, because NSDecimalNumber and double are not interchangeable.
    NSDecimalNumber *discountMultiplier =
        [[NSDecimalNumber one] decimalNumberBySubtracting:
            [NSDecimalNumber decimalNumberWithString:@(line.discountPercent).stringValue]];
    return [line.price decimalNumberByMultiplyingBy:discountMultiplier];
}
```

## Where NSNumber Genuinely Belongs

```objc
// NSNumber is the right tool specifically at boundaries that require
// an object -- Foundation collections, JSON serialization, and
// property-list encoding -- where the value doesn't stay boxed inside
// your own model layer.
NSDictionary *json = @{
    @"user_id": @(line.userID),
    @"price_cents": @([line.price decimalNumberByMultiplyingByPowerOf10:2].integerValue),
};
```

## See Also

- [`null-boxed-expression-literals`](null-boxed-expression-literals.md) - Use boxed expressions (`@(x)`, `@[]`, `@{}`) instead of manual wrapper calls
- [`perf-avoid-boxing-hot-loop`](perf-avoid-boxing-hot-loop.md) - Avoid boxing primitives into `NSNumber` inside hot loops
- [`null-avoid-id-when-concrete`](null-avoid-id-when-concrete.md) - Avoid `id` when a concrete or protocol-qualified type is known
