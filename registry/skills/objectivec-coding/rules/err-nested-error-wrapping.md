# err-nested-error-wrapping

> Wrap underlying errors via `NSUnderlyingErrorKey` instead of discarding them

## Why It Matters

When a higher-level operation fails because a lower-level one did (a document failed to load because the file read failed because the disk was unreadable), discarding the original `NSError` and replacing it with a generic one erases the actual root cause. Debugging and support end up guessing at causes that a preserved `NSUnderlyingErrorKey` chain would have shown immediately, and automated retry/backoff logic often needs to inspect the underlying error to decide whether retrying makes sense at all.

## Bad

```objc
- (nullable OMWDocument *)loadDocumentAtURL:(NSURL *)fileURL error:(NSError **)error {
    NSError *readError = nil;
    NSData *data = [NSData dataWithContentsOfURL:fileURL options:0 error:&readError];
    if (data == nil) {
        // The real cause (disk full, permission denied, file missing) is thrown away
        if (error) {
            *error = [NSError errorWithDomain:OMWDocumentErrorDomain
                                          code:OMWDocumentErrorLoadFailed
                                      userInfo:nil];  // readError is gone forever
        }
        return nil;
    }
    return [self documentFromData:data error:error];
}
```

## Good

```objc
- (nullable OMWDocument *)loadDocumentAtURL:(NSURL *)fileURL error:(NSError **)error {
    NSError *readError = nil;
    NSData *data = [NSData dataWithContentsOfURL:fileURL options:0 error:&readError];
    if (data == nil) {
        if (error) {
            *error = [NSError errorWithDomain:OMWDocumentErrorDomain
                                          code:OMWDocumentErrorLoadFailed
                                      userInfo:@{
                NSLocalizedDescriptionKey: @"Could not load document.",
                NSUnderlyingErrorKey: readError,  // Root cause preserved and inspectable
            }];
        }
        return nil;
    }
    return [self documentFromData:data error:error];
}

// Callers can walk the chain to find the actual root cause
- (void)logFullErrorChain:(NSError *)error {
    NSError *current = error;
    while (current != nil) {
        OMWLogError(@"%@ (%@ %ld)", current.localizedDescription, current.domain, (long)current.code);
        current = current.userInfo[NSUnderlyingErrorKey];
    }
}
```

## Multiple Underlying Errors (iOS 14.5+/macOS 11.3+)

```objc
// When more than one contributing error exists, use the plural key instead
// of overloading a single NSUnderlyingErrorKey.
NSError *combinedError = [NSError errorWithDomain:OMWSyncErrorDomain
                                              code:OMWSyncErrorPartialFailure
                                          userInfo:@{
    NSLocalizedDescriptionKey: @"Some items failed to sync.",
    NSMultipleUnderlyingErrorsKey: @[uploadError, downloadError],
}];
```

## See Also

- [`err-domain-code-userinfo`](err-domain-code-userinfo.md) - Building well-formed `userInfo` dictionaries
- [`err-custom-domain-constant`](err-custom-domain-constant.md) - Exporting the domain constants referenced here
- [`anti-ignore-nserror`](anti-ignore-nserror.md) - Don't silently ignore a populated `NSError`
