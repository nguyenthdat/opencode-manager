# interop-ns-error-domain

> Map `NSError` domains/codes to typed Swift errors

## Why It Matters

Objective-C APIs report failure through `NSError` with a stringly-typed `domain` and an integer `code`, which Swift callers have no compiler-checked way to switch over — you end up comparing magic strings and numbers scattered across the codebase. Left unmapped, every call site has to know the domain/code table by heart (or copy-paste it), and a typo in a domain string fails silently instead of producing a compiler error. Mapping `NSError` into a Swift `Error` enum once, at the boundary, gives every caller exhaustive `switch` handling and eliminates the stringly-typed comparisons everywhere else.

## Bad

```swift
func upload(_ data: Data) throws {
    do {
        try legacyUploader.upload(data)
    } catch let error as NSError {
        if error.domain == "com.acme.uploader" && error.code == 401 {
            // handle auth failure — string/int comparison repeated at every call site
            reauthenticate()
        } else if error.domain == "com.acme.uploader" && error.code == 413 {
            showPayloadTooLargeAlert()
        } else {
            throw error
        }
    }
}
```

## Good

```swift
enum UploadError: Error {
    case unauthorized
    case payloadTooLarge
    case underlying(NSError)

    init(_ nsError: NSError) {
        switch (nsError.domain, nsError.code) {
        case ("com.acme.uploader", 401): self = .unauthorized
        case ("com.acme.uploader", 413): self = .payloadTooLarge
        default: self = .underlying(nsError)
        }
    }
}

func upload(_ data: Data) throws(UploadError) {
    do {
        try legacyUploader.upload(data)
    } catch let error as NSError {
        throw UploadError(error)
    }
}

// Call site: exhaustive, compiler-checked, no magic strings.
do {
    try upload(payload)
} catch UploadError.unauthorized {
    reauthenticate()
} catch UploadError.payloadTooLarge {
    showPayloadTooLargeAlert()
} catch UploadError.underlying(let nsError) {
    Logger.app.error("Unmapped upload failure: \(nsError)")
}
```

## Domain Constants Instead of String Literals

Keep the raw domain/code table in one place — as `static let` constants mirroring the Objective-C `NSErrorDomain`/`NS_ERROR_ENUM` declarations — so the mapping function is the only place magic values appear:

```objc
// Uploader.h
extern NSErrorDomain const AcmeUploaderErrorDomain;
typedef NS_ERROR_ENUM(AcmeUploaderErrorDomain, AcmeUploaderError) {
    AcmeUploaderErrorUnauthorized = 401,
    AcmeUploaderErrorPayloadTooLarge = 413,
};
```

`NS_ERROR_ENUM` bridges directly into a Swift `LocalizedError`-conforming type (`AcmeUploaderError`), which is often enough on its own — write the manual `UploadError` mapping shown above only when the Objective-C side hasn't adopted `NS_ERROR_ENUM` yet.

## See Also

- [`err-enum-error-type`](err-enum-error-type.md) - the general pattern this specializes for `NSError` bridging
- [`interop-avoid-force-cast-anyobject`](interop-avoid-force-cast-anyobject.md) - avoid force-casting error `userInfo` payloads
- [`err-localized-error`](err-localized-error.md) - surface the mapped error's message to users
- [`err-do-catch-specific`](err-do-catch-specific.md) - catch the specific mapped cases before a generic fallback
