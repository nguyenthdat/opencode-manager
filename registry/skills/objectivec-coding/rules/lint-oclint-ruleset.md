# lint-oclint-ruleset

> Adopt an OCLint ruleset for structural/complexity issues

## Why It Matters

Compiler warnings and the Clang Static Analyzer catch correctness bugs, but neither flags structural problems like a 400-line method, a class with 30 instance variables, or cyclomatic complexity so high that no test suite can realistically cover every branch. OCLint runs a configurable rule set against the AST specifically for these maintainability signals, catching the "this will be unmaintainable in six months" class of problem before it's baked into a merged PR.

## Bad

```objc
// No OCLint (or equivalent) in the pipeline. This method merges clean
// because it compiles and passes tests, despite being a maintenance
// hazard: high cyclomatic complexity, deep nesting, and a parameter
// count that should have been a struct or options object long ago.
- (void)processOrderWithItems:(NSArray *)items
                      customer:(OMWCustomer *)customer
                       coupon:(NSString *)coupon
                  shippingZone:(NSInteger)zone
                    isPriority:(BOOL)priority
                 loyaltyPoints:(NSInteger)points
                    giftWrapped:(BOOL)giftWrapped {
    if (items.count > 0) {
        if (customer != nil) {
            if (coupon != nil) {
                if ([self isValidCoupon:coupon]) {
                    if (zone == 1) {
                        if (priority) {
                            // ... 15 more nested branches follow
                        }
                    }
                }
            }
        }
    }
}
```

## Good

```yaml
# .oclint.yml -- checked into the repo, run in CI via oclint-json-compilation-database.
rules:
  - CyclomaticComplexity
  - LongMethod
  - LongParameterList
  - DeepNestedBlock
  - NPathComplexity
  - TooManyFields
thresholds:
  CYCLOMATIC_COMPLEXITY: 10
  LONG_LINE: 100
  LONG_METHOD: 50
  LONG_PARAMETER_LIST: 4
  NESTED_BLOCK_DEPTH: 3
```

```objc
// Refactored to satisfy OCLint's LongParameterList and
// DeepNestedBlock rules: an options object plus early returns.
@interface OMWOrderProcessingOptions : NSObject
@property (nonatomic, copy, nullable) NSString *coupon;
@property (nonatomic, assign) NSInteger shippingZone;
@property (nonatomic, assign) BOOL isPriority;
@property (nonatomic, assign) NSInteger loyaltyPoints;
@property (nonatomic, assign) BOOL isGiftWrapped;
@end

- (void)processOrderWithItems:(NSArray<OMWItem *> *)items
                      customer:(OMWCustomer *)customer
                       options:(OMWOrderProcessingOptions *)options {
    if (items.count == 0 || customer == nil) {
        return;
    }
    if (options.coupon != nil && ![self isValidCoupon:options.coupon]) {
        return;
    }
    [self applyShippingForZone:options.shippingZone priority:options.isPriority];
}
```

## Running in CI

```bash
# Generate a compile_commands.json via xcpretty, then run OCLint against it.
xcodebuild clean build -scheme OMWStore | xcpretty -r json-compilation-database
oclint-json-compilation-database -- -rc CYCLOMATIC_COMPLEXITY=10 -max-priority-1 0
```

## See Also

- [`lint-clang-format-config`](lint-clang-format-config.md) - Enforce a shared `.clang-format` style in CI
- [`anti-massive-view-controller`](anti-massive-view-controller.md) - Don't build a Massive View Controller that owns every responsibility
- [`api-single-responsibility-class`](api-single-responsibility-class.md) - Keep each class focused on one responsibility
