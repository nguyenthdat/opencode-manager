# err-exception-programmer-only

> Reserve `NSException`/`@throw` for programmer errors, not recoverable ones

## Why It Matters

Cocoa's convention treats exceptions as fatal, unrecoverable programmer errors (wrong argument, violated precondition, out-of-bounds access) and `NSError` as the channel for recoverable runtime failures (bad network response, missing file, invalid user input). ARC does not guarantee cleanup as an exception unwinds the stack, so throwing across ARC-managed frames can leak or leave objects in an inconsistent state. Using exceptions for ordinary control flow also makes an API impossible to `try`/`catch` bridge cleanly to Swift, since Swift `Error` bridging is built around `NSError`, not `NSException`.

## Bad

```objc
- (OMWUser *)userWithID:(NSString *)userID {
    OMWUser *user = self.userCache[userID];
    if (user == nil) {
        // Missing user is an entirely ordinary, expected runtime condition -
        // this forces every caller to wrap the call in @try/@catch.
        @throw [NSException exceptionWithName:@"OMWUserNotFoundException"
                                        reason:@"No such user"
                                      userInfo:@{@"userID": userID}];
    }
    return user;
}

// Caller is now forced into exception-based control flow for a routine miss
@try {
    OMWUser *user = [store userWithID:someID];
    [self displayUser:user];
} @catch (NSException *exception) {
    [self showNotFoundUI];
}
```

## Good

```objc
- (nullable OMWUser *)userWithID:(NSString *)userID
                            error:(NSError **)error {
    OMWUser *user = self.userCache[userID];
    if (user == nil) {
        if (error != NULL) {
            *error = [NSError errorWithDomain:OMWUserStoreErrorDomain
                                          code:OMWUserStoreErrorUserNotFound
                                      userInfo:@{NSLocalizedDescriptionKey: @"No such user"}];
        }
        return nil;  // Recoverable - communicated through NSError, not an exception
    }
    return user;
}

// Programmer errors are still exceptions - these indicate a bug, not a runtime condition
- (void)setUserID:(NSString *)userID {
    NSParameterAssert(userID.length > 0);  // Throws NSInternalInconsistencyException if violated
    _userID = [userID copy];
}
```

## When @throw Is Acceptable

```objc
// 1. Precondition violations - the caller passed an invalid argument
- (void)insertObject:(id)object atIndex:(NSUInteger)index {
    if (index > self.count) {
        @throw [NSException exceptionWithName:NSRangeException  // Programmer bug, not recoverable
                                        reason:@"Index out of bounds"
                                      userInfo:nil];
    }
    [self.storage insertObject:object atIndex:index];
}

// 2. Abstract-method contracts (see api-abstract-base-assert)
- (void)draw {
    NSAssert(NO, @"Subclasses of OMWShape must override -draw");
}

// 3. Truly unrecoverable internal invariant violations
if (self.internalState == OMWStateCorrupted) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                    reason:@"Corrupted internal state"
                                  userInfo:nil];
}
```

## See Also

- [`err-recoverable-vs-fatal-line`](err-recoverable-vs-fatal-line.md) - The general recoverable-vs-fatal decision rule
- [`err-try-catch-sparing-use`](err-try-catch-sparing-use.md) - When it's appropriate to catch exceptions at all
- [`api-abstract-base-assert`](api-abstract-base-assert.md) - Using assertions/exceptions for subclass-responsibility contracts
