# err-check-return-value-first

> Check the BOOL/nil return value, not just whether an error was set

## Why It Matters

Many Cocoa APIs only guarantee that the `NSError **` out-parameter is meaningful when the method's primary return value indicates failure; some methods leave `*error` untouched even on failure, and others may (rarely) populate a non-nil `NSError` alongside a successful result for informational purposes. Branching on `error != nil` instead of the actual return value is a common source of silent, hard-to-reproduce bugs.

## Bad

```objc
NSError *error = nil;
[fileManager removeItemAtURL:fileURL error:&error];  // Return value (BOOL) discarded entirely

if (error != nil) {  // Wrong signal to check - some APIs leave error untouched on failure
    NSLog(@"Failed to remove file: %@", error);
} else {
    NSLog(@"File removed");  // May run even though removal actually failed!
}

// Same mistake with an object-returning method
NSError *parseError = nil;
NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data
                                                       options:0
                                                         error:&parseError];
if (parseError == nil) {
    [self processJSON:json];  // json might still be nil if some other path skipped setting parseError
}
```

## Good

```objc
NSError *error = nil;
BOOL removed = [fileManager removeItemAtURL:fileURL error:&error];
if (!removed) {  // Trust the BOOL - this is the documented success signal
    NSLog(@"Failed to remove file: %@", error);
    return;
}
NSLog(@"File removed");

// Object-returning method: check for nil, not for a non-nil error
NSError *parseError = nil;
NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data
                                                       options:0
                                                         error:&parseError];
if (json == nil) {  // nil is the documented failure signal
    NSLog(@"JSON parse failed: %@", parseError);
    return;
}
[self processJSON:json];
```

## Why the Return Value Is Authoritative

```objc
// Apple's documented contract for these APIs is symmetric and explicit:
//   - BOOL methods: return NO on failure, YES on success. error is populated only on NO.
//   - Object methods: return nil on failure, non-nil on success. error is populated only on nil.
// Never invert the check by inspecting **error** first, since the out-param
// is only a documented side channel, not the primary signal.

- (BOOL)writeToURL:(NSURL *)url error:(NSError **)error {
    if (![self validate]) {
        if (error) {
            *error = [NSError errorWithDomain:OMWDocumentErrorDomain
                                          code:OMWDocumentErrorInvalidContent
                                      userInfo:nil];
        }
        return NO;  // <- this is what callers must check
    }
    return [self performWrite:url error:error];
}
```

## See Also

- [`err-nserror-out-param`](err-nserror-out-param.md) - The out-parameter convention this rule depends on
- [`err-populate-error-on-failure-only`](err-populate-error-on-failure-only.md) - Only populate `*error` on the failure path
- [`anti-ignore-nserror`](anti-ignore-nserror.md) - Don't silently ignore a populated `NSError`
