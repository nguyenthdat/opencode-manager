# kvc-dictionary-literal-nil-guard

> Guard against `nil` values before building `@{}` dictionary literals

## Why It Matters

A dictionary or array literal (`@{ key: value }`, `@[ value ]`) throws `NSInvalidArgumentException` ("attempt to insert nil object") the instant any interpolated value is `nil` - there is no silent-skip behavior. Because the crash happens at the literal's construction, not at the point the `nil` originated, the crash log often points at an innocuous-looking line far from the real bug (a network response missing a field, an optional property that was never set).

## Bad

```objc
- (NSDictionary<NSString *, id> *)requestBodyForUser:(OMWUser *)user {
    // If user.middleName or user.avatarURL is nil (both are optional,
    // legitimately-nullable properties), this crashes at construction.
    return @{
        @"firstName": user.firstName,
        @"middleName": user.middleName,
        @"avatarURL": user.avatarURL.absoluteString,
    };
}
```

## Good

```objc
- (NSDictionary<NSString *, id> *)requestBodyForUser:(OMWUser *)user {
    NSMutableDictionary<NSString *, id> *body = [NSMutableDictionary dictionary];
    body[@"firstName"] = user.firstName; // Never nil per the model's contract.

    if (user.middleName != nil) {
        body[@"middleName"] = user.middleName;
    }
    if (user.avatarURL != nil) {
        body[@"avatarURL"] = user.avatarURL.absoluteString;
    }
    return [body copy];
}
```

## A Helper That Substitutes `NSNull` Instead of Omitting the Key

```objc
// Sometimes the API contract requires the key to be present even when
// there's no value (e.g. explicitly clearing a server-side field) -
// substitute NSNull rather than crash or silently drop the key.
static inline id OMWJSONValue(id _Nullable value) {
    return value ?: [NSNull null];
}

- (NSDictionary<NSString *, id> *)requestBodyClearingMiddleName {
    return @{
        @"firstName": self.firstName,
        @"middleName": OMWJSONValue(nil), // Explicitly @"middleName": NSNull, not omitted.
    };
}
```

## Building Arrays From Optional Elements

```objc
// Same hazard applies to @[]; filter nils out explicitly rather than
// interpolating a possibly-nil expression directly into the literal.
- (NSArray<NSString *> *)tagStringsForUser:(OMWUser *)user {
    NSMutableArray<NSString *> *tags = [NSMutableArray array];
    if (user.role != nil) {
        [tags addObject:user.role];
    }
    if (user.team != nil) {
        [tags addObject:user.team];
    }
    return [tags copy];
}
```

## See Also

- [`kvc-valueforkey-nil-safety`](kvc-valueforkey-nil-safety.md) - Handle `nil`/`NSNull` correctly with `valueForKey:`/`setValue:forKey:`
- [`null-boxed-expression-literals`](null-boxed-expression-literals.md) - Use boxed expressions (`@(x)`, `@[]`, `@{}`) instead of manual wrapper calls
- [`null-avoid-nsnull-sentinel-sprawl`](null-avoid-nsnull-sentinel-sprawl.md) - Centralize `NSNull` sentinel handling instead of scattering checks
