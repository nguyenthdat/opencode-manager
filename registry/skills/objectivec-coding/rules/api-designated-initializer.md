# api-designated-initializer

> Mark the one true initializer `NS_DESIGNATED_INITIALIZER`

## Why It Matters

Without a declared designated initializer, subclasses have no compiler-enforced way to know which `init...` method they must call through, and it becomes easy to write a convenience initializer that skips required setup in a superclass or a subclass initializer that only partially initializes the object. `NS_DESIGNATED_INITIALIZER` combined with `NS_UNAVAILABLE` on the inherited plain `init` gives you a compiler warning the moment the initializer chain is violated, instead of a runtime crash from an incompletely initialized instance.

## Bad

```objc
@interface OMWNetworkClient : NSObject

- (instancetype)initWithBaseURL:(NSURL *)baseURL;
- (instancetype)initWithBaseURL:(NSURL *)baseURL sessionConfiguration:(NSURLSessionConfiguration *)config;
// No indication which of these is authoritative - both look equally "real"

@end

@implementation OMWNetworkClient

- (instancetype)initWithBaseURL:(NSURL *)baseURL {
    self = [super init];
    if (self) {
        _baseURL = baseURL;
        _session = [NSURLSession sharedSession];  // Diverges from the other initializer's setup
    }
    return self;
}

- (instancetype)initWithBaseURL:(NSURL *)baseURL
             sessionConfiguration:(NSURLSessionConfiguration *)config {
    self = [super init];
    if (self) {
        _baseURL = baseURL;
        _session = [NSURLSession sessionWithConfiguration:config];
    }
    return self;  // Subclasses that override one may silently miss the other's setup
}

@end
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

@interface OMWNetworkClient : NSObject

- (instancetype)initWithBaseURL:(NSURL *)baseURL
            sessionConfiguration:(NSURLSessionConfiguration *)config NS_DESIGNATED_INITIALIZER;

// Convenience initializer must call through to the designated one
- (instancetype)initWithBaseURL:(NSURL *)baseURL;

- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

@implementation OMWNetworkClient

- (instancetype)initWithBaseURL:(NSURL *)baseURL
            sessionConfiguration:(NSURLSessionConfiguration *)config {
    self = [super init];
    if (self) {
        _baseURL = baseURL;
        _session = [NSURLSession sessionWithConfiguration:config];
    }
    return self;
}

- (instancetype)initWithBaseURL:(NSURL *)baseURL {
    // Compiler enforces that this calls the designated initializer
    return [self initWithBaseURL:baseURL
             sessionConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration]];
}

@end
```

## Subclassing a Designated Initializer

```objc
@interface OMWAuthenticatedNetworkClient : OMWNetworkClient

- (instancetype)initWithBaseURL:(NSURL *)baseURL
            sessionConfiguration:(NSURLSessionConfiguration *)config
                            token:(NSString *)token NS_DESIGNATED_INITIALIZER;

@end

@implementation OMWAuthenticatedNetworkClient

- (instancetype)initWithBaseURL:(NSURL *)baseURL
            sessionConfiguration:(NSURLSessionConfiguration *)config
                            token:(NSString *)token {
    self = [super initWithBaseURL:baseURL sessionConfiguration:config];  // Calls the superclass's designated initializer
    if (self) {
        _token = [token copy];
    }
    return self;
}

// The compiler will warn if this subclass fails to override the superclass's
// designated initializer, since a new designated initializer was introduced.
- (instancetype)initWithBaseURL:(NSURL *)baseURL
            sessionConfiguration:(NSURLSessionConfiguration *)config NS_UNAVAILABLE;

@end
```

## See Also

- [`api-init-chain-nil-check`](api-init-chain-nil-check.md) - The `self = [super init]` pattern used inside every initializer
- [`null-instancetype-init`](null-instancetype-init.md) - Returning `instancetype`, not the literal class name
- [`api-class-factory-method`](api-class-factory-method.md) - Convenience factory methods built atop the designated initializer
