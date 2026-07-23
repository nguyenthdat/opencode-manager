# interop-error-domain-bridges-to-swift-error

> Design `NSError` domains/codes to bridge cleanly to a Swift `Error` enum

## Why It Matters

Swift automatically bridges an Objective-C `NSError` domain/code pair whose codes are declared as an `NS_ERROR_ENUM` into a real Swift `Error`-conforming enum, complete with pattern-matchable cases and an auto-generated `.errorUserInfoKey` accessor for `localizedDescription`. Skipping this and just using a bare `NSInteger` code constant forces Swift callers to manually compare `error.code == OMWUploadErrorTimeout` instead of switching over real enum cases.

## Bad

```objc
// A plain constant + loose NSInteger codes: Swift sees `NSError` with an
// untyped Int code, no case-based switch, and no compiler-checked
// exhaustiveness.
extern NSString *const OMWUploadErrorDomain;

typedef NS_ENUM(NSInteger, OMWUploadError) {
    OMWUploadErrorTimeout = 1,
    OMWUploadErrorServerRejected = 2,
    OMWUploadErrorFileTooLarge = 3,
};
```

## Good

```objc
extern NSErrorDomain const OMWUploadErrorDomain;

// NS_ERROR_ENUM ties the enum to a specific domain, which is exactly
// what the Swift importer looks for to generate a real Error type.
typedef NS_ERROR_ENUM(OMWUploadErrorDomain, OMWUploadError) {
    OMWUploadErrorTimeout = 1,
    OMWUploadErrorServerRejected = 2,
    OMWUploadErrorFileTooLarge = 3,
};
```

```swift
// Swift sees this as a genuine, switchable Error type:
do {
    try uploader.upload(fileURL: url)
} catch let error as OMWUploadError {
    switch error {
    case .timeout:
        retry()
    case .serverRejected:
        showServerError()
    case .fileTooLarge:
        showSizeError()
    @unknown default:
        showGenericError()
    }
} catch {
    showGenericError()
}
```

## Populating `userInfo` So Swift's `localizedDescription` Works

```objc
NSError *error = [NSError errorWithDomain:OMWUploadErrorDomain
                                       code:OMWUploadErrorFileTooLarge
                                    userInfo:@{
    NSLocalizedDescriptionKey: @"The selected file exceeds the 25 MB upload limit.",
    NSLocalizedRecoverySuggestionErrorKey: @"Choose a smaller file or compress it first.",
}];
// error.localizedDescription in Swift reads exactly this string.
```

## Domain Constant Must Be Exported, Not Inlined

```objc
// OMWUploadError.h
extern NSErrorDomain const OMWUploadErrorDomain;

// OMWUploadError.m
NSErrorDomain const OMWUploadErrorDomain = @"com.omw.upload";
// A string literal repeated at every call site instead of this shared
// constant would silently break equality checks on typos.
```

## See Also

- [`err-domain-code-userinfo`](err-domain-code-userinfo.md) - Define a proper error domain, code enum, and localized `userInfo`
- [`interop-ns-refined-for-swift`](interop-ns-refined-for-swift.md) - Use `NS_REFINED_FOR_SWIFT` to wrap a low-level ObjC API with a nicer Swift overlay
- [`err-custom-domain-constant`](err-custom-domain-constant.md) - Declare error domains as exported string constants, not inline literals
