# null-avoid-nsnull-sentinel-sprawl

> Centralize `NSNull` sentinel handling instead of scattering checks

## Why It Matters

Foundation collections can't store `nil` directly, so JSON deserialization and dictionary/array literals use `NSNull` (`[NSNull null]`) as a placeholder for "explicitly no value." If every call site that reads a collection has to remember to check `isKindOfClass:[NSNull class]` (or `== [NSNull null]`) before using a value, that check gets forgotten somewhere, and an `NSNull` sneaks through into code expecting a real `NSString`/`NSNumber`, crashing on the very next message send. Centralizing the `NSNull`-to-`nil` conversion at the data's entry point (e.g. right after `NSJSONSerialization`) means the rest of the codebase never has to think about `NSNull` again.

## Bad

```objc
// Every call site that touches parsed JSON has to remember this check itself:
- (void)handleUserPayload:(NSDictionary *)payload {
    id middleName = payload[@"middleName"];
    if (middleName != nil && ![middleName isKindOfClass:[NSNull class]]) {
        self.middleName = middleName;
    }
    // ... repeated ad hoc, slightly differently, at every other call site
    // that reads this same dictionary elsewhere in the codebase.
}

- (void)logUserPayload:(NSDictionary *)payload {
    NSLog(@"Middle name: %@", payload[@"middleName"]);  // Forgot the check here - prints "<null>"
}
```

## Good

```objc
// Convert NSNull -> nil exactly once, at the boundary where untrusted data
// enters the app, so nothing downstream ever has to special-case NSNull:
@implementation NSDictionary (OMWNullSanitizing)

- (NSDictionary *)omw_dictionaryByRemovingNullValues {
    NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:self.count];
    [self enumerateKeysAndObjectsUsingBlock:^(id key, id value, BOOL *stop) {
        if (![value isKindOfClass:[NSNull class]]) {
            result[key] = value;
        }
    }];
    return [result copy];
}

@end

- (void)handleUserPayload:(NSDictionary *)rawPayload {
    NSDictionary *payload = [rawPayload omw_dictionaryByRemovingNullValues];
    self.middleName = payload[@"middleName"];  // Simply nil if absent; no NSNull check needed anywhere
}
```

## Recursive Sanitizing for Nested JSON

```objc
- (id)omw_sanitizedJSONValue:(id)value {
    if ([value isKindOfClass:[NSNull class]]) {
        return nil;
    }
    if ([value isKindOfClass:[NSDictionary class]]) {
        return [(NSDictionary *)value omw_dictionaryByRemovingNullValues];
    }
    if ([value isKindOfClass:[NSArray class]]) {
        NSMutableArray *cleaned = [NSMutableArray array];
        for (id item in (NSArray *)value) {
            id sanitized = [self omw_sanitizedJSONValue:item];
            if (sanitized != nil) {
                [cleaned addObject:sanitized];
            }
        }
        return [cleaned copy];
    }
    return value;
}
```

## When You Genuinely Need to Distinguish "Absent" From "Explicitly Null"

```objc
// If the API contract truly cares about the difference (e.g. a PATCH request
// where "field omitted" and "field explicitly set to null" mean different
// things), keep NSNull but confine the check to a single, named accessor:
- (BOOL)payloadExplicitlyClearsMiddleName:(NSDictionary *)rawPayload {
    return [rawPayload[@"middleName"] isKindOfClass:[NSNull class]];
}
```

## See Also

- [`kvc-valueforkey-nil-safety`](kvc-valueforkey-nil-safety.md) - Handle `nil`/`NSNull` correctly with `valueForKey:`/`setValue:forKey:`
- [`kvc-dictionary-literal-nil-guard`](kvc-dictionary-literal-nil-guard.md) - Guard against `nil` values before building `@{}` dictionary literals
- [`test-nil-vs-null-assertion-clarity`](test-nil-vs-null-assertion-clarity.md) - Distinguish asserting `nil` from asserting `NSNull`
