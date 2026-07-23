# test-nil-vs-null-assertion-clarity

> Distinguish asserting `nil` from asserting `NSNull`

## Why It Matters

`nil` (the absence of an Objective-C object) and `NSNull` (a real singleton object that represents "no value" *inside* a collection, since collections can't store `nil` directly) are not interchangeable, but they're easy to conflate in an assertion. `XCTAssertNil(dict[@"key"])` is always false when `dict[@"key"]` is `[NSNull null]`, because `[NSNull null]` is a real, non-nil object — a test written this way silently never catches the bug it was meant to catch.

## Bad

```objc
- (void)testParsedResponse_missingFieldIsNil {
    NSDictionary *json = @{@"name": @"Ada", @"email": [NSNull null]};
    OMWUser *user = [OMWUser userFromJSONDictionary:json];

    XCTAssertNil(user.email);
    // If -userFromJSONDictionary: naively does `user.email = json[@"email"]`
    // without converting NSNull to nil, this assertion is checking the wrong thing:
    // user.email is actually [NSNull null], which is never nil, so this test would
    // need to fail here but a bug in the sanitization code could make it pass by accident
    // if the property itself silently discards NSNull on assignment.
}
```

## Good

```objc
- (void)testParsedResponse_missingFieldIsConvertedFromNSNullToNil {
    NSDictionary *json = @{@"name": @"Ada", @"email": [NSNull null]};
    OMWUser *user = [OMWUser userFromJSONDictionary:json];

    // Explicitly assert both facts: the raw JSON value IS NSNull, and the sanitized
    // model property is real nil, proving the conversion actually happened.
    XCTAssertEqualObjects(json[@"email"], [NSNull null]);
    XCTAssertNil(user.email);
}

- (void)testParsedResponse_presentFieldPassesThrough {
    NSDictionary *json = @{@"name": @"Ada", @"email": @"ada@example.com"};
    OMWUser *user = [OMWUser userFromJSONDictionary:json];

    XCTAssertEqualObjects(user.email, @"ada@example.com");
}
```

## Writing the Sanitization Being Tested

```objc
+ (instancetype)userFromJSONDictionary:(NSDictionary<NSString *, id> *)json {
    OMWUser *user = [[OMWUser alloc] init];
    id emailValue = json[@"email"];
    user.email = (emailValue == [NSNull null]) ? nil : emailValue;  // Convert NSNull -> nil
    return user;
}
```

## Asserting a Collection Slot Is Explicitly `NSNull`, Not Merely Absent

```objc
- (void)testEncodedArray_preservesExplicitNullSlot {
    NSArray *decoded = [OMWJSONCoder decode:self.jsonWithNullElement];

    XCTAssertEqual(decoded.count, 3U);            // The slot exists...
    XCTAssertEqualObjects(decoded[1], [NSNull null]); // ...and is explicitly null, not just missing
}
```

## See Also

- [`test-specific-xctassert-macros`](test-specific-xctassert-macros.md) - Use the most specific `XCTAssert*` macro available
- [`kvc-valueforkey-nil-safety`](kvc-valueforkey-nil-safety.md) - Handle `nil`/`NSNull` correctly with `valueForKey:`/`setValue:forKey:`
- [`null-avoid-nsnull-sentinel-sprawl`](null-avoid-nsnull-sentinel-sprawl.md) - Centralize `NSNull` sentinel handling instead of scattering checks
