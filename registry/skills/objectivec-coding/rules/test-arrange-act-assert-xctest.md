# test-arrange-act-assert-xctest

> Structure XCTest methods as arrange/act/assert

## Why It Matters

A test that interleaves setup, invocation, and verification forces the reader to mentally re-simulate the whole method to figure out which state was given, which action was under test, and which outcome was actually checked. Separating a test into clear arrange/act/assert sections makes each test read as a single clean statement of behavior, and makes it obvious at a glance whether a failing assertion is testing what the test's name claims it tests.

## Bad

```objc
- (void)testDiscountApplied {
    OMWCart *cart = [[OMWCart alloc] init];
    [cart addItem:[OMWCartItem itemWithPrice:10.0]];
    XCTAssertEqual(cart.items.count, 1);              // Assertion mixed into setup
    [cart addItem:[OMWCartItem itemWithPrice:20.0]];
    OMWDiscount *discount = [OMWDiscount percentageDiscount:0.1];
    [cart applyDiscount:discount];
    XCTAssertEqualWithAccuracy(cart.total, 27.0, 0.01); // Real assertion buried after more setup
}
```

## Good

```objc
- (void)testApplyDiscount_reducesTotalByDiscountPercentage {
    // Arrange
    OMWCart *cart = [[OMWCart alloc] init];
    [cart addItem:[OMWCartItem itemWithPrice:10.0]];
    [cart addItem:[OMWCartItem itemWithPrice:20.0]];
    OMWDiscount *discount = [OMWDiscount percentageDiscount:0.1];

    // Act
    [cart applyDiscount:discount];

    // Assert
    XCTAssertEqualWithAccuracy(cart.total, 27.0, 0.01, @"10% off a $30 cart should be $27");
}
```

## Keeping "Arrange" Itself Testable and Minimal

```objc
- (void)testRemoveItem_decreasesItemCount {
    // Arrange - build only what this test needs, via a small helper, not inline in every test
    OMWCart *cart = [self cartWithItemCount:3];

    // Act
    [cart removeItemAtIndex:0];

    // Assert
    XCTAssertEqual(cart.items.count, 2);
}

- (OMWCart *)cartWithItemCount:(NSUInteger)count {
    OMWCart *cart = [[OMWCart alloc] init];
    for (NSUInteger i = 0; i < count; i++) {
        [cart addItem:[OMWCartItem itemWithPrice:10.0 * (i + 1)]];
    }
    return cart;
}
```

## One Logical Assertion Per Test

```objc
// Prefer splitting into two focused tests over one test asserting two unrelated outcomes
- (void)testApplyDiscount_reducesTotal {
    OMWCart *cart = [self cartWithItemCount:2];
    [cart applyDiscount:[OMWDiscount percentageDiscount:0.5]];
    XCTAssertEqualWithAccuracy(cart.total, 15.0, 0.01);
}

- (void)testApplyDiscount_setsAppliedDiscountProperty {
    OMWCart *cart = [self cartWithItemCount:2];
    OMWDiscount *discount = [OMWDiscount percentageDiscount:0.5];
    [cart applyDiscount:discount];
    XCTAssertEqualObjects(cart.appliedDiscount, discount);
}
```

## See Also

- [`test-descriptive-method-names`](test-descriptive-method-names.md) - Name test methods after the behavior they verify
- [`test-specific-xctassert-macros`](test-specific-xctassert-macros.md) - Use the most specific `XCTAssert*` macro available
- [`test-setup-teardown-lifecycle`](test-setup-teardown-lifecycle.md) - Use `setUp`/`tearDown` for fixture lifecycle, not ad hoc init
