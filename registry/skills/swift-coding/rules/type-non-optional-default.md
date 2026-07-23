# type-non-optional-default

> Prefer non-optional properties with sensible defaults over optionals

## Why It Matters

Every optional property is a permanent liability: every reader and every future line of code that touches it must consider the `nil` case, forever, even if `nil` almost never happens or has one obvious default. When a property has a natural default value (empty string, zero, empty array, a well-defined "none" case), making it non-optional with that default removes an entire unwrap burden from the rest of the codebase.

## Bad

```swift
struct UserProfile {
    var displayName: String?
    var followerCount: Int?
    var tags: [String]?
}

func greeting(for profile: UserProfile) -> String {
    let name = profile.displayName ?? "Anonymous"
    let count = profile.followerCount ?? 0
    let tagList = profile.tags ?? []
    return "\(name) (\(count) followers, \(tagList.count) tags)"
    // Every single call site has to repeat these defaults.
}
```

## Good

```swift
struct UserProfile {
    var displayName: String = "Anonymous"
    var followerCount: Int = 0
    var tags: [String] = []
}

func greeting(for profile: UserProfile) -> String {
    return "\(profile.displayName) (\(profile.followerCount) followers, \(profile.tags.count) tags)"
}
```

## When Optional Really Is Correct

Keep `Optional` for properties where `nil` is a distinct, meaningful state — not just "unset" — and defaulting would hide real information:

```swift
struct UserProfile {
    var displayName: String = "Anonymous"
    var followerCount: Int = 0
    var tags: [String] = []

    // nil here means "user has not set a birthday," which is different
    // from any specific date — defaulting it to some date would be a lie.
    var birthday: Date?

    // nil means "not yet fetched from the network" — distinct from
    // an empty avatar, so keep it optional and represent loading state
    // separately (see type-enum-associated-values).
    var avatarURL: URL?
}
```

Ask "does `nil` mean something different from the natural default, or am I just being lazy about initialization?" If it's the latter, remove the optional.

## See Also

- [`type-enum-associated-values`](type-enum-associated-values.md) - model truly distinct states as enums instead of stacked optionals
- [`type-nil-coalescing`](type-nil-coalescing.md) - use ?? at the boundary if you can't change the type
- [`api-immutable-by-default`](api-immutable-by-default.md) - pair defaults with `let` where possible
