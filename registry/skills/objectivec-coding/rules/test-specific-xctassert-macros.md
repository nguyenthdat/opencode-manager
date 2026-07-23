# test-specific-xctassert-macros

> Use the most specific `XCTAssert*` macro available

## Why It Matters

A generic `XCTAssertTrue(a == b)` and a specific `XCTAssertEqual(a, b)` check the same condition, but only the specific macro's failure message tells you the actual and expected values without any extra work — `XCTAssertTrue` just reports "false is not true." Using the wrong macro for object comparisons is worse than unhelpful: `XCTAssertEqual` on two `NSString *` compares pointer identity, not string equality, so a subtly wrong test can pass or fail for the wrong reason entirely.

## Bad

```objc
- (void)testUserName_matchesConstructorArgument {
    OMWUser *user = [[OMWUser alloc] initWithName:@"Ada" email:@"ada@example.com"];

    XCTAssertTrue([user.name isEqualToString:@"Ada"]);   // Failure just says "false is not true"
}

- (void)testUsers_containsExpectedUser {
    NSArray<OMWUser *> *users = [self loadUsers];

    XCTAssertTrue(users.count > 0);                       // Loses the actual count on failure
}

- (void)testFetchedUser_isNotNil {
    OMWUser *user = [self.store fetchUserWithID:@"42"];

    XCTAssertTrue(user != nil);                           // XCTAssertNotNil exists for exactly this
}
```

## Good

```objc
- (void)testUserName_matchesConstructorArgument {
    OMWUser *user = [[OMWUser alloc] initWithName:@"Ada" email:@"ada@example.com"];

    XCTAssertEqualObjects(user.name, @"Ada");
    // On failure: "("Ada2") is not equal to ("Ada")" - shows both values automatically
}

- (void)testUsers_containsExpectedUser {
    NSArray<OMWUser *> *users = [self loadUsers];

    XCTAssertGreaterThan(users.count, 0U);
}

- (void)testFetchedUser_isNotNil {
    OMWUser *user = [self.store fetchUserWithID:@"42"];

    XCTAssertNotNil(user);
}
```

## Matching the Macro to the Comparison Being Made

```objc
XCTAssertEqual(cart.items.count, 2U);              // Primitive/scalar equality (NSUInteger, int, etc.)
XCTAssertEqualObjects(cart.appliedDiscount, discount); // Object equality via -isEqual:
XCTAssertEqualWithAccuracy(cart.total, 27.0, 0.001);   // Floating point, needs a tolerance
XCTAssertNil(cart.appliedDiscount);
XCTAssertNotNil(cart.items);
XCTAssertTrue(cart.isEmpty);
XCTAssertFalse(cart.hasPendingChanges);
XCTAssertThrowsSpecificNamed([cart removeItemAtIndex:99], NSException, NSRangeException);
XCTAssertNoThrow([cart removeItemAtIndex:0]);
XCTAssertGreaterThanOrEqual(cart.total, 0.0);
```

## Adding a Failure Message for Non-Obvious Assertions

```objc
XCTAssertEqualWithAccuracy(cart.total, 27.0, 0.01,
    @"10%% discount on a $30 cart should leave $27, got %f", cart.total);
```

## See Also

- [`test-nil-vs-null-assertion-clarity`](test-nil-vs-null-assertion-clarity.md) - Distinguish asserting `nil` from asserting `NSNull`
- [`test-arrange-act-assert-xctest`](test-arrange-act-assert-xctest.md) - Structure XCTest methods as arrange/act/assert
- [`test-descriptive-method-names`](test-descriptive-method-names.md) - Name test methods after the behavior they verify
