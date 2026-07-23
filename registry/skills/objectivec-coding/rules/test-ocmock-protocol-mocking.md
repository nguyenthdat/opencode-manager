# test-ocmock-protocol-mocking

> Use OCMock to mock protocols/classes at collaboration boundaries

## Why It Matters

Hand-rolled fake classes for every collaborator add boilerplate that has to be kept in sync with the real API by hand, and hand-rolled partial-mocking of a concrete class (subclassing plus overriding methods) is fragile and breaks silently when the real class changes. OCMock generates mocks dynamically at test time from the actual protocol or class declaration, so a mock automatically fails loudly if the code under test calls a method that was renamed or removed, instead of quietly drifting out of sync.

## Bad

```objc
// Hand-rolled fake that must be manually kept in sync with OMWNetworkClientDelegate forever
@interface FakeNetworkClientDelegate : NSObject <OMWNetworkClientDelegate>
@property (nonatomic, assign) BOOL didFinishLoadingCalled;
@end

@implementation FakeNetworkClientDelegate
- (void)networkClientDidFinishLoading:(OMWNetworkClient *)client {
    self.didFinishLoadingCalled = YES;
}
@end

- (void)testClient_notifiesDelegateOnFinish {
    FakeNetworkClientDelegate *delegate = [[FakeNetworkClientDelegate alloc] init];
    self.client.delegate = delegate;

    [self.client finishLoadingForTesting];

    XCTAssertTrue(delegate.didFinishLoadingCalled);
}
```

## Good

```objc
#import <OCMock/OCMock.h>

- (void)testClient_notifiesDelegateOnFinish {
    id delegateMock = OCMProtocolMock(@protocol(OMWNetworkClientDelegate));
    self.client.delegate = delegateMock;

    OCMExpect([delegateMock networkClientDidFinishLoading:self.client]);

    [self.client finishLoadingForTesting];

    OCMVerifyAll(delegateMock);
}
```

## Mocking a Concrete Class to Stub One Method

```objc
- (void)testFetchUser_whenCacheHasUser_skipsNetworkCall {
    id cacheMock = OCMClassMock([OMWUserCache class]);
    OCMStub([cacheMock cachedUserWithID:@"42"]).andReturn(self.sampleUser);

    OMWUserStore *store = [[OMWUserStore alloc] initWithCache:cacheMock
                                                 networkClient:self.networkClientMock];
    OMWUser *user = [store fetchUserWithID:@"42"];

    XCTAssertEqualObjects(user, self.sampleUser);
    OCMReject([self.networkClientMock fetchUserWithID:[OCMArg any] completion:[OCMArg any]]);
}
```

## Stubbing a Completion-Block Argument

```objc
- (void)testFetchUser_propagatesNetworkError {
    NSError *networkError = [NSError errorWithDomain:@"OMWNetwork" code:500 userInfo:nil];
    id clientMock = OCMClassMock([OMWNetworkClient class]);

    OCMStub([clientMock fetchUserWithID:[OCMArg any] completion:([OCMArg invokeBlockWithArgs:[NSNull null], networkError, nil])]);

    XCTestExpectation *expectation = [self expectationWithDescription:@"error propagated"];
    [clientMock fetchUserWithID:@"42" completion:^(OMWUser *user, NSError *error) {
        XCTAssertEqualObjects(error, networkError);
        [expectation fulfill];
    }];
    [self waitForExpectations:@[expectation] timeout:1.0];
}
```

## See Also

- [`test-protocol-injection-for-mocking`](test-protocol-injection-for-mocking.md) - Depend on protocols, not concrete classes, to enable test doubles
- [`test-async-expectation-waiting`](test-async-expectation-waiting.md) - Use `XCTestExpectation`/`waitForExpectations` for async code
- [`test-avoid-testing-private-api`](test-avoid-testing-private-api.md) - Test through the public interface, not private methods/ivars
