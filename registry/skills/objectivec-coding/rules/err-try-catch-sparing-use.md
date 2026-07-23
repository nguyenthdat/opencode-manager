# err-try-catch-sparing-use

> Use `@try`/`@catch` only around APIs that legitimately throw, not for control flow

## Why It Matters

`@try`/`@catch` in Objective-C is not free: ARC's exception-safety guarantees are weaker than `NSError`-based flows, and `@try` blocks can disable some compiler optimizations and complicate correct cleanup of non-object resources. Since almost all of Cocoa's own APIs report recoverable failure through `NSError`/`BOOL`/`nil` rather than exceptions, wrapping ordinary calls in `@try`/`@catch` "just in case" adds overhead and complexity for a case that will essentially never trigger, while masking the handful of APIs that genuinely do throw (e.g. `NSFileHandle`, key-value coding with an invalid key, Core Data validation in some paths).

## Bad

```objc
// Wrapping ordinary NSError-based Cocoa calls in @try/@catch - these don't throw
- (nullable NSData *)loadFileAtPath:(NSString *)path {
    @try {
        NSError *error = nil;
        NSData *data = [NSData dataWithContentsOfFile:path
                                               options:0
                                                 error:&error];  // Never throws; reports via NSError
        return data;
    } @catch (NSException *exception) {
        return nil;  // This branch is dead code that hides real bugs if reached
    }
}

// Using exceptions for expected control flow
@try {
    id value = dictionary[key];  // Never throws for a missing key - just returns nil
    [self process:value];
} @catch (NSException *exception) {
    [self processDefault];
}
```

## Good

```objc
// Use the documented NSError channel for APIs that report failure that way
- (nullable NSData *)loadFileAtPath:(NSString *)path error:(NSError **)error {
    return [NSData dataWithContentsOfFile:path options:0 error:error];
}

// Reserve @try/@catch for APIs that are documented to throw
- (nullable id)valueForUndeclaredKey:(NSString *)key onObject:(id)object {
    @try {
        // -valueForKey: throws NSUnknownKeyException for keys with no accessor
        // and no matching ivar - this is a genuinely exception-based API.
        return [object valueForKey:key];
    } @catch (NSException *exception) {
        OMWLogError(@"Undeclared key '%@' on %@: %@", key, object, exception);
        return nil;
    }
}

// NSFileHandle operations can also throw for invalid file descriptors
- (void)closeFileHandleSafely:(NSFileHandle *)handle {
    @try {
        [handle closeFile];  // Documented to throw on an already-closed handle
    } @catch (NSException *exception) {
        OMWLogError(@"Error closing file handle: %@", exception);
    }
}
```

## Always Use @finally for Cleanup

```objc
NSFileHandle *handle = [NSFileHandle fileHandleForReadingAtPath:path];
@try {
    [self processFileHandle:handle];  // May throw for an invalid handle
} @catch (NSException *exception) {
    OMWLogError(@"Processing failed: %@", exception);
} @finally {
    [handle closeFile];  // Runs whether or not an exception was thrown
}
```

## See Also

- [`err-exception-programmer-only`](err-exception-programmer-only.md) - What exceptions should actually be used for
- [`err-recoverable-vs-fatal-line`](err-recoverable-vs-fatal-line.md) - Deciding which channel a given failure belongs on
- [`err-nserror-out-param`](err-nserror-out-param.md) - The preferred channel for recoverable failures
