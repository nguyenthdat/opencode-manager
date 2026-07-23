# api-codable-conformance

> Conform models to `Codable` for serialization boundaries

## Why It Matters

`Codable` gives the compiler enough information to synthesize `Encodable`/`Decodable` conformance automatically for straightforward models, which means one declaration keeps JSON (or plist, or any `Encoder`/`Decoder`) serialization in sync with the model's actual shape. Hand-rolled parsing (manually walking a `[String: Any]` dictionary) has no compile-time connection to the model, so a renamed or added property silently stops round-tripping instead of failing to build.

## Bad

```swift
struct User {
    let id: String
    let name: String
    let email: String
}

func decodeUser(from json: [String: Any]) -> User? {
    guard let id = json["id"] as? String,
          let name = json["name"] as? String,
          let email = json["email"] as? String else {
        return nil   // silently loses the actual decoding failure reason
    }
    return User(id: id, name: name, email: email)
}
```

## Good

```swift
struct User: Codable {
    let id: String
    let name: String
    let email: String
}

let decoder = JSONDecoder()
let user = try decoder.decode(User.self, from: jsonData)   // synthesized, type-checked, throws real errors
```

## Custom Coding Keys and Nested Structures

Use `CodingKeys` to map mismatched field names, and nested `Codable` types decode automatically as part of the parent's synthesis:

```swift
struct User: Codable {
    let id: String
    let fullName: String
    let profile: Profile

    enum CodingKeys: String, CodingKey {
        case id
        case fullName = "full_name"
        case profile
    }
}

struct Profile: Codable {
    let bio: String
    let avatarURL: URL
}
```

For fields that need custom transformation logic (e.g. a non-standard date format), implement `init(from:)`/`encode(to:)` manually only for those specific fields rather than abandoning synthesis for the whole type — decode manually into an intermediate `CodingKeys`-driven container and post-process just the one field.

## See Also

- [`api-equatable-hashable-derive`](api-equatable-hashable-derive.md) - the parallel synthesis story for equality/hashing
- [`err-localized-error`](err-localized-error.md) - surfacing decode failures with user-facing context
- [`api-immutable-by-default`](api-immutable-by-default.md) - `let` properties work naturally with Codable's synthesized initializers
