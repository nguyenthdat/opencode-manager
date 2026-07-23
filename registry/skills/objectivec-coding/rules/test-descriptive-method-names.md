# test-descriptive-method-names

> Name test methods after the behavior they verify

## Why It Matters

XCTest surfaces failures by method name alone in the test navigator, CI logs, and Xcode's inline red X — if that name is `testCart` or `testCase2`, a failure tells you nothing until you open the source and read the body. A name that states the scenario and the expected outcome (`testApplyDiscount_whenCartIsEmpty_throwsInvalidStateError`) turns a CI failure list into a readable specification of what broke.

## Bad

```objc
- (void)testCart {                    // Tests what, exactly?
    OMWCart *cart = [self emptyCart];
    [cart addItem:[OMWCartItem itemWithPrice:10.0]];
    XCTAssertEqual(cart.items.count, 1);
}

- (void)test2 {                       // Meaningless numeric suffix
    OMWCart *cart = [self cartWithItemCount:2];
    [cart removeAllItems];
    XCTAssertEqual(cart.total, 0.0);
}

- (void)testDiscountStuff {           // Vague, doesn't state expected behavior
    // ...
}
```

## Good

```objc
- (void)testAddItem_incrementsItemCount {
    OMWCart *cart = [self emptyCart];
    [cart addItem:[OMWCartItem itemWithPrice:10.0]];
    XCTAssertEqual(cart.items.count, 1);
}

- (void)testRemoveAllItems_resetsTotalToZero {
    OMWCart *cart = [self cartWithItemCount:2];
    [cart removeAllItems];
    XCTAssertEqual(cart.total, 0.0);
}

- (void)testApplyDiscount_whenCartIsEmpty_throwsInvalidStateError {
    OMWCart *cart = [self emptyCart];
    OMWDiscount *discount = [OMWDiscount percentageDiscount:0.1];

    XCTAssertThrowsSpecificNamed([cart applyDiscount:discount],
                                  NSException,
                                  OMWCartInvalidStateException);
}
```

## A Consistent Naming Template

```objc
// test<UnitOfWork>_<StateUnderTest>_<ExpectedBehavior>

- (void)testFetchUser_whenUserIDIsInvalid_returnsNilWithError { }
- (void)testFetchUser_whenNetworkIsUnreachable_retriesThreeTimes { }
- (void)testFetchUser_whenResponseIsCached_skipsNetworkCall { }

// Simpler cases can drop the middle segment when there's no meaningful "state" axis
- (void)testUserFullName_concatenatesFirstAndLastName { }
```

## Grouping Related Tests with `#pragma mark`

```objc
#pragma mark - applyDiscount:

- (void)testApplyDiscount_reducesTotalByPercentage { }
- (void)testApplyDiscount_whenCartIsEmpty_throwsInvalidStateError { }
- (void)testApplyDiscount_whenDiscountExceedsTotal_clampsToZero { }

#pragma mark - removeItemAtIndex:

- (void)testRemoveItemAtIndex_decreasesItemCount { }
- (void)testRemoveItemAtIndex_whenIndexOutOfBounds_raisesException { }
```

## See Also

- [`test-arrange-act-assert-xctest`](test-arrange-act-assert-xctest.md) - Structure XCTest methods as arrange/act/assert
- [`name-verbose-descriptive`](name-verbose-descriptive.md) - Prefer verbose, descriptive names over cryptic abbreviations
- [`test-specific-xctassert-macros`](test-specific-xctassert-macros.md) - Use the most specific `XCTAssert*` macro available
