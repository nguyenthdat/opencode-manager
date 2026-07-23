# anti-unchecked-id-cast

> Don't cast `id` to a concrete type without an `isKindOfClass:` check

## Why It Matters

`id` erases static type information, so the compiler will let you assign any object to a variable of any concrete type without complaint — including a value that came from `NSJSONSerialization`, a `userInfo` dictionary, or a KVO callback where the actual runtime class may not be what you assumed. Sending a message the object doesn't respond to then crashes with `unrecognized selector sent to instance`, at runtime, often in production, instead of being caught by a cheap defensive check.

## Bad

```objc
// JSON structure is assumed but never verified: if the server ever
// sends a number instead of a string for "name", or omits the key
// entirely and NSJSONSerialization substitutes NSNull, this crashes.
- (void)handleJSONResponse:(id)json {
    NSDictionary *dict = json;
    NSString *name = dict[@"name"];
    NSUInteger length = [name length];   // Crashes if name is NSNull
                                           // or an NSNumber, not NSString.
}
```

```objc
// KVO callback assumes the change dictionary's value is always the
// expected type -- crashes if a subclass posts a different type.
- (void)observeValueForKeyPath:(NSString *)keyPath
                       ofObject:(id)object
                         change:(NSDictionary *)change
                        context:(void *)context {
    NSNumber *newValue = change[NSKeyValueChangeNewKey];
    double value = [newValue doubleValue];   // Crashes if the new value
                                               // is NSNull (a legal KVO
                                               // representation of nil).
}
```

## Good

```objc
- (void)handleJSONResponse:(id)json {
    if (![json isKindOfClass:[NSDictionary class]]) {
        OMWLogError(@"Unexpected JSON response type: %@", [json class]);
        return;
    }
    NSDictionary *dict = json;
    id nameValue = dict[@"name"];
    if (![nameValue isKindOfClass:[NSString class]]) {
        OMWLogError(@"Expected string for 'name', got: %@", [nameValue class]);
        return;
    }
    NSString *name = nameValue;
    NSUInteger length = [name length];
}
```

```objc
- (void)observeValueForKeyPath:(NSString *)keyPath
                       ofObject:(id)object
                         change:(NSDictionary *)change
                        context:(void *)context {
    id newValue = change[NSKeyValueChangeNewKey];
    if (![newValue isKindOfClass:[NSNumber class]]) {
        return;   // Handles NSNull (nil-representing KVO sentinel) safely.
    }
    double value = [(NSNumber *)newValue doubleValue];
}
```

## A Reusable Safe-Cast Helper

```objc
// A small category can centralize the pattern instead of repeating
// isKindOfClass: checks at every call site.
@implementation NSDictionary (OMWSafeAccess)

- (nullable id)omw_objectOfClass:(Class)aClass forKey:(id)key {
    id value = self[key];
    return [value isKindOfClass:aClass] ? value : nil;
}

@end

NSString *name = [dict omw_objectOfClass:[NSString class] forKey:@"name"];
```

## See Also

- [`null-avoid-id-when-concrete`](null-avoid-id-when-concrete.md) - Avoid `id` when a concrete or protocol-qualified type is known
- [`kvc-valueforkey-nil-safety`](kvc-valueforkey-nil-safety.md) - Handle `nil`/`NSNull` correctly with `valueForKey:`/`setValue:forKey:`
- [`null-avoid-nsnull-sentinel-sprawl`](null-avoid-nsnull-sentinel-sprawl.md) - Centralize `NSNull` sentinel handling instead of scattering checks
