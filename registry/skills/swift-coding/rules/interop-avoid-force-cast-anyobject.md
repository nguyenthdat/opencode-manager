# interop-avoid-force-cast-anyobject

> Avoid force-casting bridged `Any`/`AnyObject` results

## Why It Matters

Objective-C APIs that return `id`, `NSArray *`, or `NSDictionary *` bridge into Swift as `Any`, `AnyObject`, `[Any]`, or `[AnyHashable: Any]` because the compiler cannot statically know the runtime type. Force-casting (`as!`) that result assumes the Objective-C side will always hand back exactly the type you expect — but userInfo dictionaries, `NSNotification` payloads, plist-derived data, and JSON-derived `Any` graphs are exactly the places where a mismatched or legacy value slips through and crashes the app instead of failing gracefully.

## Bad

```swift
NotificationCenter.default.addObserver(forName: .userDidUpdate, object: nil, queue: .main) { note in
    let userInfo = note.userInfo!
    let userID = userInfo["userID"] as! String       // crashes if key missing or wrong type
    let profile = userInfo["profile"] as! UserProfile // crashes on legacy notification shape
    apply(userID: userID, profile: profile)
}

let plist = try! PropertyListSerialization.propertyList(from: data, format: nil)
let settings = plist as! [String: String]             // crashes on any non-string value
```

## Good

```swift
NotificationCenter.default.addObserver(forName: .userDidUpdate, object: nil, queue: .main) { note in
    guard
        let userInfo = note.userInfo,
        let userID = userInfo["userID"] as? String,
        let profile = userInfo["profile"] as? UserProfile
    else {
        Logger.app.warning("Malformed userDidUpdate notification: \(note.userInfo ?? [:])")
        return
    }
    apply(userID: userID, profile: profile)
}

let plist = try PropertyListSerialization.propertyList(from: data, format: nil)
guard let settings = plist as? [String: String] else {
    throw ConfigError.unexpectedPlistShape
}
```

## When the Cast Is Genuinely Guaranteed

If you control both sides of the bridge (you posted the notification, you wrote the plist) and the shape is enforced by a single internal factory, a safe cast with a clear failure path is still cheaper than a crash — but document the invariant instead of silently trusting it:

```swift
// Only ever constructed by `NotificationFactory.userDidUpdate(userID:profile:)`,
// which guarantees these keys/types. Still use `as?` — defensive by default.
func postUserDidUpdate(userID: String, profile: UserProfile) {
    NotificationCenter.default.post(
        name: .userDidUpdate,
        object: nil,
        userInfo: ["userID": userID, "profile": profile]
    )
}
```

## See Also

- [`type-as-safe-cast`](type-as-safe-cast.md) - the general safe-cast rule this specializes for bridged types
- [`anti-force-cast-abuse`](anti-force-cast-abuse.md) - anti-pattern reference
- [`interop-foundation-value-types`](interop-foundation-value-types.md) - reduce bridged `Any` surface by using native value types
- [`interop-ns-error-domain`](interop-ns-error-domain.md) - the analogous risk with untyped `NSError` from Objective-C
