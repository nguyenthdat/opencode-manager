# err-domain-code-userinfo

> Define a proper error domain, code enum, and localized `userInfo`

## Why It Matters

An `NSError` built from a raw string domain and a magic-number code is untyped, undiscoverable, and impossible to switch over safely — callers either string-compare or guess at integers, and both break silently when the implementation changes. A well-defined domain constant, `NS_ERROR_ENUM`, and populated `NSLocalizedDescriptionKey`/`NSLocalizedFailureReasonErrorKey` give callers (and Swift, via automatic `Error` enum bridging) a stable, self-documenting contract.

## Bad

```objc
// Ad hoc domain string, undocumented magic code, no human-readable message
NSError *error = [NSError errorWithDomain:@"com.opswat.mywidget.err"
                                      code:7
                                  userInfo:nil];

// Caller has to know that "7" means "expired session" from tribal knowledge
if ([error.domain isEqualToString:@"com.opswat.mywidget.err"] && error.code == 7) {
    [self promptReauthentication];
}
```

## Good

```objc
// OMWNetworkClient.h
NS_ASSUME_NONNULL_BEGIN

extern NSErrorDomain const OMWNetworkClientErrorDomain;

typedef NS_ERROR_ENUM(OMWNetworkClientErrorDomain, OMWNetworkClientErrorCode) {
    OMWNetworkClientErrorUnknown = 0,
    OMWNetworkClientErrorSessionExpired = 1,
    OMWNetworkClientErrorRateLimited = 2,
    OMWNetworkClientErrorUnreachable = 3,
};

NS_ASSUME_NONNULL_END

// OMWNetworkClient.m
NSErrorDomain const OMWNetworkClientErrorDomain = @"com.opswat.mywidget.OMWNetworkClientErrorDomain";

- (NSError *)sessionExpiredError {
    return [NSError errorWithDomain:OMWNetworkClientErrorDomain
                                code:OMWNetworkClientErrorSessionExpired
                            userInfo:@{
        NSLocalizedDescriptionKey: NSLocalizedString(@"Your session has expired.", nil),
        NSLocalizedRecoverySuggestionErrorKey: NSLocalizedString(@"Please sign in again.", nil),
    }];
}

// Caller checks the enum, not a magic number
if ([error.domain isEqualToString:OMWNetworkClientErrorDomain] &&
    error.code == OMWNetworkClientErrorSessionExpired) {
    [self promptReauthentication];
}
```

## Swift Bridging Payoff

```objc
// NS_ERROR_ENUM generates a proper Swift Error type automatically:
typedef NS_ERROR_ENUM(OMWNetworkClientErrorDomain, OMWNetworkClientErrorCode) {
    OMWNetworkClientErrorSessionExpired = 1,
};
```

```swift
// Bridges to:
catch OMWNetworkClientError.sessionExpired {
    promptReauthentication()
}
```

## See Also

- [`err-custom-domain-constant`](err-custom-domain-constant.md) - Export the domain as a real symbol, not an inline literal
- [`err-nested-error-wrapping`](err-nested-error-wrapping.md) - Preserve underlying errors when wrapping
- [`interop-error-domain-bridges-to-swift-error`](interop-error-domain-bridges-to-swift-error.md) - Designing domains that bridge cleanly to Swift
