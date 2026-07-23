# err-recoverable-vs-fatal-line

> Draw a clear line between `NSError` (recoverable) and assertion/exception (programmer bug)

## Why It Matters

Conflating "the network is down" with "you called this method with a nil argument you were told never to pass" leads to APIs that either crash on ordinary runtime conditions or silently swallow real programmer bugs behind an `NSError`. Choosing the wrong channel for a given failure means callers either can't recover from something recoverable, or are lulled into thinking a bug in their own code is just another error case to branch on.

## Bad

```objc
- (nullable OMWUser *)userWithID:(NSString *)userID error:(NSError **)error {
    // A nil/empty userID is a caller bug (violated precondition), not a runtime
    // condition - but it's routed through NSError, so callers "handle" it
    // instead of fixing the bug that produced it.
    if (userID.length == 0) {
        if (error) {
            *error = [NSError errorWithDomain:OMWUserStoreErrorDomain
                                          code:OMWUserStoreErrorInvalidArgument
                                      userInfo:nil];
        }
        return nil;
    }
    return self.userCache[userID];
}

- (void)connectToServer {
    // Meanwhile, an ordinary and expected runtime failure (host unreachable)
    // is escalated to a crash instead of being reported recoverably.
    if (![self.reachability isReachable]) {
        @throw [NSException exceptionWithName:@"OMWUnreachableException"
                                        reason:@"Server unreachable"
                                      userInfo:nil];
    }
}
```

## Good

```objc
- (nullable OMWUser *)userWithID:(NSString *)userID error:(NSError **)error {
    // Precondition violation -> assertion. This is a bug in the CALLER's code,
    // and it should fail loudly and immediately during development.
    NSParameterAssert(userID.length > 0);

    OMWUser *user = self.userCache[userID];
    if (user == nil) {
        // Ordinary runtime condition -> NSError. The caller did nothing wrong;
        // the user genuinely isn't cached yet, and callers can recover
        // (e.g. fetch from network) without treating it as a crash.
        if (error) {
            *error = [NSError errorWithDomain:OMWUserStoreErrorDomain
                                          code:OMWUserStoreErrorUserNotFound
                                      userInfo:nil];
        }
        return nil;
    }
    return user;
}

- (void)connectToServerWithCompletion:(void (^)(NSError *_Nullable error))completion {
    // Server unreachability is an expected, recoverable runtime condition.
    if (![self.reachability isReachable]) {
        completion([NSError errorWithDomain:OMWNetworkClientErrorDomain
                                        code:OMWNetworkClientErrorUnreachable
                                    userInfo:nil]);
        return;
    }
    [self performConnection:completion];
}
```

## The Decision Rule

```objc
// Ask: "Did the CALLER do something wrong, or did the WORLD do something
// unexpected?"
//
//   Caller passed nil where NS_ASSUME_NONNULL forbids it   -> assertion/exception
//   Caller violated a documented precondition               -> assertion/exception
//   Subclass failed to override an abstract method          -> assertion/exception
//   Network request failed, disk full, file missing         -> NSError
//   User typed invalid input                                -> NSError
//   Parsing malformed but externally-sourced data            -> NSError
```

## See Also

- [`err-exception-programmer-only`](err-exception-programmer-only.md) - What exceptions are reserved for
- [`err-nserror-out-param`](err-nserror-out-param.md) - The recoverable-failure channel
- [`anti-unvalidated-nonnull-violation`](anti-unvalidated-nonnull-violation.md) - Don't pass `nil` across a `nonnull` boundary
