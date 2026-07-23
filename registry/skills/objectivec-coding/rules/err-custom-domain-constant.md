# err-custom-domain-constant

> Declare error domains as exported string constants, not inline literals

## Why It Matters

An inline string literal used as an error domain (`@"com.opswat.mywidget.err"`) has no single source of truth: every call site that constructs or compares against it must retype the literal exactly, and a typo produces a silently non-matching domain that compiles fine but never equals what callers check against. An exported `NSErrorDomain const` constant is typo-proof at compile time, gives Xcode autocomplete, and is the form Apple's own frameworks and `NS_ERROR_ENUM` expect.

## Bad

```objc
// OMWParserService.m
- (NSError *)malformedInputError {
    return [NSError errorWithDomain:@"com.opswat.mywidget.parser"  // Literal #1
                                code:1
                            userInfo:nil];
}

// OMWParserServiceTests.m
- (void)testMalformedInput {
    NSError *error = ...;
    XCTAssertEqualObjects(error.domain, @"com.opswat.myWidget.parser");  // Typo: capital W - silently never matches
}
```

## Good

```objc
// OMWParserService.h
NS_ASSUME_NONNULL_BEGIN

extern NSErrorDomain const OMWParserServiceErrorDomain;

typedef NS_ERROR_ENUM(OMWParserServiceErrorDomain, OMWParserServiceErrorCode) {
    OMWParserServiceErrorMalformedInput = 1,
    OMWParserServiceErrorUnsupportedVersion = 2,
};

NS_ASSUME_NONNULL_END

// OMWParserService.m
NSErrorDomain const OMWParserServiceErrorDomain = @"com.opswat.mywidget.OMWParserServiceErrorDomain";

- (NSError *)malformedInputError {
    return [NSError errorWithDomain:OMWParserServiceErrorDomain
                                code:OMWParserServiceErrorMalformedInput
                            userInfo:nil];
}

// OMWParserServiceTests.m
- (void)testMalformedInput {
    NSError *error = ...;
    XCTAssertEqualObjects(error.domain, OMWParserServiceErrorDomain);  // Compiler catches any typo/rename
    XCTAssertEqual(error.code, OMWParserServiceErrorMalformedInput);
}
```

## Naming Convention

```objc
// Prefer the pattern: <ClassOrModuleName>ErrorDomain, reverse-DNS as the string value.
extern NSErrorDomain const OMWNetworkClientErrorDomain;
extern NSErrorDomain const OMWDocumentStoreErrorDomain;

// Value should be a stable, reverse-DNS string that will never collide with
// a system framework's own domain (e.g. NSCocoaErrorDomain, NSURLErrorDomain).
NSErrorDomain const OMWNetworkClientErrorDomain = @"com.opswat.mywidget.OMWNetworkClientErrorDomain";
```

## See Also

- [`err-domain-code-userinfo`](err-domain-code-userinfo.md) - Building the full domain/code/userInfo triple
- [`name-constant-namespaced`](name-constant-namespaced.md) - Namespacing exported constants generally
- [`interop-error-domain-bridges-to-swift-error`](interop-error-domain-bridges-to-swift-error.md) - How this constant form bridges to Swift
