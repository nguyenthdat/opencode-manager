# err-nserror-out-param

> Use the `NSError **` out-parameter convention for recoverable failures

## Why It Matters

Cocoa's calling convention for recoverable failures is a `BOOL`/`nil` return value plus a trailing `NSError **` out-parameter — not a thrown exception, not a raw error code. Callers (and Swift, via automatic `throws` bridging) expect this exact shape; deviating from it breaks `try`/`catch` bridging, makes the API unusable from Swift without a wrapper, and forces every caller to invent their own ad hoc error-reporting scheme.

## Bad

```objc
// Returns an error code with no context - caller must consult a separate table
- (NSInteger)loadDocumentAtURL:(NSURL *)fileURL;

// Throws an NSException for something entirely recoverable (bad file, bad permissions)
- (OMWDocument *)loadDocumentAtURL:(NSURL *)fileURL {
    NSData *data = [NSData dataWithContentsOfURL:fileURL];
    if (data == nil) {
        @throw [NSException exceptionWithName:@"OMWLoadException"  // Wrong tool for a recoverable I/O failure
                                        reason:@"Could not read file"
                                      userInfo:nil];
    }
    return [self documentFromData:data];
}

// Custom out-parameter shape that doesn't match the Cocoa convention
- (OMWDocument *)loadDocumentAtURL:(NSURL *)fileURL
                        errorString:(NSString **)errorString;  // Not NSError, no domain/code, doesn't bridge to Swift
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

@interface OMWDocumentLoader : NSObject

// BOOL/nil return communicates success; NSError** out-param carries the reason.
- (nullable OMWDocument *)loadDocumentAtURL:(NSURL *)fileURL
                                      error:(NSError **)error;

@end

NS_ASSUME_NONNULL_END

@implementation OMWDocumentLoader

- (nullable OMWDocument *)loadDocumentAtURL:(NSURL *)fileURL
                                      error:(NSError **)error {
    NSError *readError = nil;
    NSData *data = [NSData dataWithContentsOfURL:fileURL
                                          options:0
                                            error:&readError];
    if (data == nil) {
        if (error != NULL) {
            *error = readError;
        }
        return nil;  // nil return signals failure; error is populated
    }
    return [self documentFromData:data];
}

@end
```

## Swift Bridging Payoff

```objc
// This ObjC declaration:
- (nullable OMWDocument *)loadDocumentAtURL:(NSURL *)fileURL error:(NSError **)error;
```

```swift
// ...bridges automatically to idiomatic Swift error handling:
let document = try loader.loadDocument(at: fileURL)
```

No wrapper code is needed on the Swift side as long as the last parameter is named `error` and typed `NSError **`, and the method either returns a `BOOL` or an optional/nullable object.

## See Also

- [`err-check-return-value-first`](err-check-return-value-first.md) - Check the BOOL/nil return, not just whether an error was set
- [`err-populate-error-on-failure-only`](err-populate-error-on-failure-only.md) - Only write `*error` on the failure path
- [`err-completion-block-error-convention`](err-completion-block-error-convention.md) - The async equivalent of this convention
- [`anti-ignore-nserror`](anti-ignore-nserror.md) - Don't silently ignore a populated `NSError`
