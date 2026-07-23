# test-isolated-fixture-no-shared-state

> Give each test isolated fixtures; avoid shared mutable test state

## Why It Matters

XCTest does not guarantee test execution order, and with parallel testing enabled it may run multiple test methods (even from different test case classes) concurrently in separate processes or interleaved on the same process. A shared mutable fixture — a class-level singleton, a static mutable array, a file written by one test and read by another — produces tests that pass or fail depending on execution order or timing, and a failure in one test can cascade into false failures in unrelated tests that happen to run afterward.

## Bad

```objc
@interface OMWUserStoreTests : XCTestCase
@end

static OMWUserStore *sSharedStore;   // Shared across every test in the process

@implementation OMWUserStoreTests

+ (void)setUp {
    [super setUp];
    sSharedStore = [[OMWUserStore alloc] init];   // Created once, reused by every test
}

- (void)testAddUser_increasesCount {
    [sSharedStore addUser:[OMWUser userWithName:@"Ada"]];
    XCTAssertEqual(sSharedStore.users.count, 1);   // Passes alone, fails if another test ran first
}

- (void)testRemoveAllUsers_emptiesStore {
    [sSharedStore removeAllUsers];
    XCTAssertEqual(sSharedStore.users.count, 0);   // Order-dependent: must run after testAddUser
}

@end
```

## Good

```objc
@interface OMWUserStoreTests : XCTestCase
@property (nonatomic, strong) OMWUserStore *store;
@end

@implementation OMWUserStoreTests

- (void)setUp {
    [super setUp];
    self.store = [[OMWUserStore alloc] init];   // Fresh instance per test method
}

- (void)tearDown {
    self.store = nil;
    [super tearDown];
}

- (void)testAddUser_increasesCount {
    [self.store addUser:[OMWUser userWithName:@"Ada"]];
    XCTAssertEqual(self.store.users.count, 1);
}

- (void)testRemoveAllUsers_emptiesStore {
    [self.store addUser:[OMWUser userWithName:@"Ada"]];
    [self.store removeAllUsers];
    XCTAssertEqual(self.store.users.count, 0);
}

@end
```

## Isolating Filesystem/Persistent Fixtures Too

```objc
- (void)setUp {
    [super setUp];
    // A unique directory per test avoids collisions with parallel test workers
    NSString *uniqueName = [NSString stringWithFormat:@"OMWTest-%@", [NSUUID UUID].UUIDString];
    self.temporaryDirectoryURL = [NSURL fileURLWithPath:
        [NSTemporaryDirectory() stringByAppendingPathComponent:uniqueName]];
    [[NSFileManager defaultManager] createDirectoryAtURL:self.temporaryDirectoryURL
                              withIntermediateDirectories:YES
                                               attributes:nil
                                                    error:nil];
}

- (void)tearDown {
    [[NSFileManager defaultManager] removeItemAtURL:self.temporaryDirectoryURL error:nil];
    [super tearDown];
}
```

## Avoiding Singletons as Test Fixtures

```objc
// If production code depends on a real singleton, inject a fresh instance for tests
// instead of resetting shared global state between tests.
OMWUserStore *store = [[OMWUserStore alloc] init];   // Not [OMWUserStore sharedStore]
OMWCheckoutViewModel *viewModel = [[OMWCheckoutViewModel alloc] initWithUserStore:store];
```

## See Also

- [`test-setup-teardown-lifecycle`](test-setup-teardown-lifecycle.md) - Use `setUp`/`tearDown` for fixture lifecycle, not ad hoc init
- [`test-protocol-injection-for-mocking`](test-protocol-injection-for-mocking.md) - Depend on protocols, not concrete classes, to enable test doubles
- [`anti-massive-view-controller`](anti-massive-view-controller.md) - Don't build a Massive View Controller that owns every responsibility
