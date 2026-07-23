# test-avoid-testing-private-api

> Test through the public interface, not private methods/ivars

## Why It Matters

A test that reaches into a private method or ivar (via a class extension import, `valueForKey:`, or exposing `@private` state just for testing) couples the test suite to implementation details that are free to change without changing observable behavior. Every internal refactor then breaks tests that were never actually verifying behavior a caller depends on, which trains the team to treat failing tests as noise instead of signal.

## Bad

```objc
// OMWCart+Private.h - imported only so tests can reach into internals
@interface OMWCart ()
@property (nonatomic, strong) NSMutableArray<OMWCartItem *> *internalItems;
- (double)rawSubtotalBeforeTax;
@end

// OMWCartTests.m
#import "OMWCart+Private.h"

- (void)testInternalItemsArray_containsAddedItem {
    OMWCart *cart = [[OMWCart alloc] init];
    [cart addItem:[OMWCartItem itemWithPrice:10.0]];

    XCTAssertEqual(cart.internalItems.count, 1);   // Tests a private ivar, not public behavior
}

- (void)testRawSubtotalBeforeTax {
    OMWCart *cart = [[OMWCart alloc] init];
    [cart addItem:[OMWCartItem itemWithPrice:10.0]];

    XCTAssertEqual([cart rawSubtotalBeforeTax], 10.0); // Calls a private method directly
}
```

## Good

```objc
// OMWCartTests.m - only imports the public header
#import "OMWCart.h"

- (void)testAddItem_increasesPublicItemCount {
    OMWCart *cart = [[OMWCart alloc] init];
    [cart addItem:[OMWCartItem itemWithPrice:10.0]];

    XCTAssertEqual(cart.items.count, 1);    // "items" is a public, readonly property
}

- (void)testTotal_reflectsSubtotalAndTax {
    OMWCart *cart = [[OMWCart alloc] init];
    [cart addItem:[OMWCartItem itemWithPrice:10.0]];

    XCTAssertEqualWithAccuracy(cart.total, 10.80, 0.01);  // Public "total" already includes tax
}
```

## When Private Behavior Genuinely Needs Coverage

```objc
// If a private helper is complex enough to deserve its own tests, that's a signal
// it should be its own small, independently-testable public type instead of a
// buried private method.

@interface OMWTaxCalculator : NSObject     // Extracted from OMWCart's private internals
- (double)taxForSubtotal:(double)subtotal inRegion:(OMWTaxRegion *)region;
@end

- (void)testTaxCalculator_appliesRegionalRate {
    OMWTaxCalculator *calculator = [[OMWTaxCalculator alloc] init];
    double tax = [calculator taxForSubtotal:100.0 inRegion:OMWTaxRegionCalifornia];
    XCTAssertEqualWithAccuracy(tax, 8.0, 0.01);
}
```

## See Also

- [`test-protocol-injection-for-mocking`](test-protocol-injection-for-mocking.md) - Depend on protocols, not concrete classes, to enable test doubles
- [`api-class-extension-private-api`](api-class-extension-private-api.md) - Hide private properties/methods in a class-extension (anonymous category)
- [`anti-massive-view-controller`](anti-massive-view-controller.md) - Don't build a Massive View Controller that owns every responsibility
