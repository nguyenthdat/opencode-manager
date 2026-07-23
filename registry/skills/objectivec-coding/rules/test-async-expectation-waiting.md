# test-async-expectation-waiting

> Use `XCTestExpectation`/`waitForExpectations` for async code

## Why It Matters

A test method that returns before its asynchronous work has actually completed will pass trivially every time regardless of what that async code does, because XCTest has no way to know it should wait. `XCTestExpectation` gives the test runner an explicit signal to block on, with a timeout that turns "async callback never fired" into a real, visible test failure instead of silent false-positive green checkmarks.

## Bad

```objc
- (void)testFetchUser_returnsUserFromNetwork {
    OMWNetworkClient *client = [[OMWNetworkClient alloc] init];
    __block OMWUser *fetchedUser = nil;

    [client fetchUserWithID:@"42" completion:^(OMWUser *user, NSError *error) {
        fetchedUser = user;                     // Runs on a background queue, asynchronously
    }];

    // The test method returns immediately - fetchedUser is almost certainly still nil here.
    XCTAssertNotNil(fetchedUser);                 // Passes or fails based on race timing, not correctness
}
```

## Good

```objc
- (void)testFetchUser_returnsUserFromNetwork {
    OMWNetworkClient *client = [[OMWNetworkClient alloc] init];
    XCTestExpectation *expectation = [self expectationWithDescription:@"fetch user completion"];
    __block OMWUser *fetchedUser = nil;

    [client fetchUserWithID:@"42" completion:^(OMWUser *user, NSError *error) {
        fetchedUser = user;
        [expectation fulfill];
    }];

    [self waitForExpectations:@[expectation] timeout:5.0];

    XCTAssertNotNil(fetchedUser);
    XCTAssertEqualObjects(fetchedUser.userID, @"42");
}
```

## Waiting on Multiple Independent Async Calls

```objc
- (void)testFetchAllUsers_fetchesEachUserConcurrently {
    NSArray<NSString *> *userIDs = @[@"1", @"2", @"3"];
    NSMutableArray<XCTestExpectation *> *expectations = [NSMutableArray array];

    for (NSString *userID in userIDs) {
        XCTestExpectation *expectation =
            [self expectationWithDescription:[NSString stringWithFormat:@"fetch user %@", userID]];
        [expectations addObject:expectation];

        [self.client fetchUserWithID:userID completion:^(OMWUser *user, NSError *error) {
            XCTAssertNil(error);
            [expectation fulfill];
        }];
    }

    [self waitForExpectations:expectations timeout:10.0];
}
```

## Guarding Against a Completion That Fires More Than Once

```objc
- (void)testFetchUser_completionIsCalledExactlyOnce {
    XCTestExpectation *expectation = [self expectationWithDescription:@"single completion"];
    expectation.assertForOverFulfill = YES;   // Fails the test if fulfill() is called twice

    [self.client fetchUserWithID:@"42" completion:^(OMWUser *user, NSError *error) {
        [expectation fulfill];
    }];

    [self waitForExpectations:@[expectation] timeout:5.0];
}
```

## See Also

- [`conc-completion-handler-single-call`](conc-completion-handler-single-call.md) - Guarantee a completion handler is invoked exactly once on every path
- [`test-ocmock-protocol-mocking`](test-ocmock-protocol-mocking.md) - Use OCMock to mock protocols/classes at collaboration boundaries
- [`test-performance-measure-block`](test-performance-measure-block.md) - Use `-measureBlock:`/`XCTMetric` for performance regressions
