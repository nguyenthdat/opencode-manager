# test-uitest-separate-target

> Keep `XCUITest` UI tests in a separate target from unit tests

## Why It Matters

`XCUITest` tests launch a fresh instance of the app as a black box and drive it through the accessibility hierarchy, which makes them orders of magnitude slower and flakier than in-process unit tests. Mixing both kinds in one test target means a single slow, environment-sensitive UI test can block or destabilize the entire suite, and CI can no longer run the fast unit-test target on every commit while reserving the expensive UI target for a slower nightly/pre-merge lane.

## Bad

```objc
// OMWAppTests target - unit tests and UI tests dumped together
@interface OMWCartTests : XCTestCase   // Fast, in-process unit test
- (void)testAddItem_incrementsItemCount;
@end

@interface OMWCheckoutFlowUITests : XCTestCase  // Slow, launches the whole app - wrong target!
@property (nonatomic, strong) XCUIApplication *app;
- (void)testCheckoutFlow_completesFromCartToConfirmation;
@end
```

## Good

```objc
// OMWAppTests target (unit tests only, runs on every commit)
@interface OMWCartTests : XCTestCase
- (void)testAddItem_incrementsItemCount;
@end

// OMWAppUITests target (separate target, XCUITest bundle, runs on a slower CI lane)
@interface OMWCheckoutFlowUITests : XCTestCase
@property (nonatomic, strong) XCUIApplication *app;
@end

@implementation OMWCheckoutFlowUITests

- (void)setUp {
    [super setUp];
    self.continueAfterFailure = NO;
    self.app = [[XCUIApplication alloc] init];
    [self.app launch];
}

- (void)testCheckoutFlow_completesFromCartToConfirmation {
    [self.app.buttons[@"Add to Cart"] tap];
    [self.app.tabBars.buttons[@"Cart"] tap];
    [self.app.buttons[@"Checkout"] tap];

    XCTAssertTrue(self.app.staticTexts[@"Order Confirmed"].waitForExistenceWithTimeout(5.0));
}

@end
```

## Configuring the Xcode Scheme to Run Them at Different Cadences

```
// .xcscheme (conceptual layout, not literal XML)
TestAction:
  TestableReference: OMWAppTests        (parallelizable, runs on every PR)
  TestableReference: OMWAppUITests      (not parallelizable, runs nightly / pre-merge only)
```

## Keeping UI Tests Focused on User-Visible Flows, Not Business Logic

```objc
// Wrong layer for a UI test - this belongs in a fast OMWCartTests unit test instead
- (void)testDiscountCalculation_appliesTenPercent {  // Don't drive this through the UI
    [self.app.textFields[@"Discount Code"] typeText:@"SAVE10"];
    // ...
}

// Right use of a UI test - verifying the screens connect and navigate correctly
- (void)testApplyingDiscountCode_updatesDisplayedTotal {
    [self.app.textFields[@"Discount Code"] typeText:@"SAVE10"];
    [self.app.buttons[@"Apply"] tap];
    XCTAssertTrue([self.app.staticTexts[@"$27.00"] waitForExistenceWithTimeout:2.0]);
}
```

## See Also

- [`test-performance-measure-block`](test-performance-measure-block.md) - Use `-measureBlock:`/`XCTMetric` for performance regressions
- [`test-isolated-fixture-no-shared-state`](test-isolated-fixture-no-shared-state.md) - Give each test isolated fixtures; avoid shared mutable test state
- [`anti-massive-view-controller`](anti-massive-view-controller.md) - Don't build a Massive View Controller that owns every responsibility
