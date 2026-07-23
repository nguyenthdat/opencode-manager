# test-protocol-injection-for-mocking

> Depend on protocols, not concrete classes, to enable test doubles

## Why It Matters

A class that hardcodes a dependency on a concrete type (instantiating `OMWNetworkClient` directly inside itself, or requiring exactly that class as an initializer parameter) cannot be tested without making a real network call, because there's no seam to substitute a fake at. Depending on a protocol instead — and injecting the concrete implementation from outside — lets tests substitute a lightweight stub or an OCMock protocol mock with zero changes to the production code path.

## Bad

```objc
@interface OMWUserStore : NSObject
@end

@implementation OMWUserStore {
    OMWNetworkClient *_networkClient;   // Concrete type, constructed internally
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _networkClient = [[OMWNetworkClient alloc] init];  // Always hits the real network
    }
    return self;
}

- (void)fetchUserWithID:(NSString *)userID completion:(void (^)(OMWUser *, NSError *))completion {
    [_networkClient fetchUserWithID:userID completion:completion];
}

@end

// Any test of OMWUserStore now makes a real network request - slow, flaky, and offline-hostile.
```

## Good

```objc
@protocol OMWUserFetching <NSObject>
- (void)fetchUserWithID:(NSString *)userID
             completion:(void (^)(OMWUser *_Nullable user, NSError *_Nullable error))completion;
@end

@interface OMWNetworkClient (OMWUserFetching) <OMWUserFetching>
@end

@interface OMWUserStore : NSObject
- (instancetype)initWithUserFetcher:(id<OMWUserFetching>)userFetcher NS_DESIGNATED_INITIALIZER;
@end

@implementation OMWUserStore {
    id<OMWUserFetching> _userFetcher;
}

- (instancetype)initWithUserFetcher:(id<OMWUserFetching>)userFetcher {
    self = [super init];
    if (self) {
        _userFetcher = userFetcher;
    }
    return self;
}

- (void)fetchUserWithID:(NSString *)userID completion:(void (^)(OMWUser *, NSError *))completion {
    [_userFetcher fetchUserWithID:userID completion:completion];
}

@end
```

## Testing With a Lightweight Stub Instead of a Mocking Framework

```objc
@interface OMWStubUserFetcher : NSObject <OMWUserFetching>
@property (nonatomic, strong, nullable) OMWUser *userToReturn;
@property (nonatomic, strong, nullable) NSError *errorToReturn;
@end

@implementation OMWStubUserFetcher
- (void)fetchUserWithID:(NSString *)userID completion:(void (^)(OMWUser *, NSError *))completion {
    completion(self.userToReturn, self.errorToReturn);
}
@end

- (void)testFetchUser_returnsUserFromFetcher {
    OMWStubUserFetcher *stub = [[OMWStubUserFetcher alloc] init];
    stub.userToReturn = self.sampleUser;
    OMWUserStore *store = [[OMWUserStore alloc] initWithUserFetcher:stub];

    XCTestExpectation *expectation = [self expectationWithDescription:@"fetch"];
    [store fetchUserWithID:@"42" completion:^(OMWUser *user, NSError *error) {
        XCTAssertEqualObjects(user, self.sampleUser);
        [expectation fulfill];
    }];
    [self waitForExpectations:@[expectation] timeout:1.0];
}
```

## See Also

- [`test-ocmock-protocol-mocking`](test-ocmock-protocol-mocking.md) - Use OCMock to mock protocols/classes at collaboration boundaries
- [`api-delegate-protocol-pattern`](api-delegate-protocol-pattern.md) - Use a delegate protocol for customizable callbacks
- [`null-avoid-id-when-concrete`](null-avoid-id-when-concrete.md) - Avoid `id` when a concrete or protocol-qualified type is known
