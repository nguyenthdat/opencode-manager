# test-setup-teardown-lifecycle

> Use `setUp`/`tearDown` for fixture lifecycle, not ad hoc init

## Why It Matters

XCTest instantiates a fresh test-case instance for every single test method, then calls `-setUp` before and `-tearDown` after each one — this is the only lifecycle hook XCTest guarantees runs for every test, including ones added later. Building fixtures inside a custom `-init` or a shared helper called inconsistently from individual tests means some tests silently run against stale or partially-initialized state, and cleanup that only happens in one test's body never runs if that test isn't the one that fails.

## Bad

```objc
@interface OMWCartTests : XCTestCase
@property (nonatomic, strong) OMWCart *cart;
@end

@implementation OMWCartTests

- (instancetype)init {                          // Custom init - XCTest lifecycle doesn't guarantee reset ordering
    self = [super init];
    if (self) {
        _cart = [[OMWCart alloc] init];
        [_cart addItem:[OMWCartItem itemWithPrice:10.0]];
    }
    return self;
}

- (void)testTotal {
    XCTAssertEqual(self.cart.total, 10.0);
}

- (void)testRemoveItemClearsCart {
    [self.cart removeItemAtIndex:0];
    // No teardown - if a later test assumes a fresh self.cart, it may see stale state
    XCTAssertEqual(self.cart.items.count, 0);
}

@end
```

## Good

```objc
@interface OMWCartTests : XCTestCase
@property (nonatomic, strong) OMWCart *cart;
@end

@implementation OMWCartTests

- (void)setUp {
    [super setUp];
    self.cart = [[OMWCart alloc] init];
    [self.cart addItem:[OMWCartItem itemWithPrice:10.0]];
}

- (void)tearDown {
    self.cart = nil;
    [super tearDown];
}

- (void)testTotal_reflectsAddedItemPrice {
    XCTAssertEqual(self.cart.total, 10.0);
}

- (void)testRemoveItemAtIndex_clearsCart {
    [self.cart removeItemAtIndex:0];
    XCTAssertEqual(self.cart.items.count, 0);
}

@end
```

## Cleaning Up Resources That Outlive the Test Object

```objc
- (void)setUp {
    [super setUp];
    self.temporaryFileURL = [self makeTemporaryFileWithContents:@"fixture data"];
}

- (void)tearDown {
    [[NSFileManager defaultManager] removeItemAtURL:self.temporaryFileURL error:nil];
    self.temporaryFileURL = nil;
    [super tearDown];
}
```

## Async Setup with `setUpWithError:` (Modern XCTest)

```objc
- (void)setUpWithError:(NSError **)error {
    [super setUpWithError:error];
    self.continueAfterFailure = NO;   // Stop this test at the first failed assertion
}

- (void)tearDownWithError:(NSError **)error {
    [self.mockNetworkClient stopMocking];
    [super tearDownWithError:error];
}
```

## See Also

- [`test-isolated-fixture-no-shared-state`](test-isolated-fixture-no-shared-state.md) - Give each test isolated fixtures; avoid shared mutable test state
- [`test-arrange-act-assert-xctest`](test-arrange-act-assert-xctest.md) - Structure XCTest methods as arrange/act/assert
- [`test-protocol-injection-for-mocking`](test-protocol-injection-for-mocking.md) - Depend on protocols, not concrete classes, to enable test doubles
