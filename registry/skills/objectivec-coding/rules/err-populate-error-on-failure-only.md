# err-populate-error-on-failure-only

> Only populate `*error` when returning failure, never on success

## Why It Matters

Callers are entitled to assume that a non-nil `*error` after a call means the call failed, and that a successful call leaves whatever was in `*error` before the call untouched. Writing to `*error` on the success path (or leaving stale garbage in it) breaks that assumption, causing correct-looking code elsewhere to misdiagnose success as failure — especially when callers reuse the same local `NSError *` variable across multiple calls without resetting it.

## Bad

```objc
- (BOOL)saveDocument:(OMWDocument *)document error:(NSError **)error {
    BOOL success = [self writeDocumentToDisk:document];
    if (error != NULL) {
        // Populates *error unconditionally, even when success is YES,
        // handing the caller a non-nil NSError alongside a successful result.
        *error = success ? nil : [self genericSaveError];
    }
    return success;
}

// Caller reuses one NSError* across calls without resetting it between them
NSError *error = nil;
[loader loadDocumentAtURL:urlA error:&error];  // fails, error is now set
BOOL saved = [store saveDocument:doc error:&error];  // succeeds
if (error != nil) {  // Still non-nil from the FIRST call - false failure signal
    [self showSaveFailedAlert];
}
```

## Good

```objc
- (BOOL)saveDocument:(OMWDocument *)document error:(NSError **)error {
    BOOL success = [self writeDocumentToDisk:document];
    if (!success && error != NULL) {
        *error = [self genericSaveError];  // Only write on the failure path
    }
    return success;  // On success, *error is left exactly as the caller passed it in
}

// Callers should still use a fresh NSError* (or check the return value) per call
NSError *loadError = nil;
OMWDocument *doc = [loader loadDocumentAtURL:urlA error:&loadError];
if (doc == nil) {
    [self handleError:loadError];
    return;
}

NSError *saveError = nil;
BOOL saved = [store saveDocument:doc error:&saveError];
if (!saved) {
    [self handleError:saveError];
}
```

## A Common Variant: Guarding with `if (error)`

```objc
// Correct pattern seen throughout Foundation and AppKit/UIKit:
- (BOOL)validateValue:(id)value error:(NSError **)error {
    if (![self isValidValue:value]) {
        if (error) {  // Caller may legitimately pass NULL - always guard the write
            *error = [self validationErrorForValue:value];
        }
        return NO;
    }
    return YES;  // No write to *error at all on the success path
}
```

## See Also

- [`err-check-return-value-first`](err-check-return-value-first.md) - Why the return value, not `*error`, is the primary signal
- [`err-nserror-out-param`](err-nserror-out-param.md) - The out-parameter convention this refines
- [`anti-ignore-nserror`](anti-ignore-nserror.md) - Don't silently ignore a populated `NSError`
