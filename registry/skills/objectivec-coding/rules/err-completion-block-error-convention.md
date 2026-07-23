# err-completion-block-error-convention

> Put the error argument last in completion blocks; nil result on failure

## Why It Matters

Asynchronous APIs can't use an `NSError **` out-parameter, since the call returns before the result is known. Cocoa's async convention mirrors the synchronous one instead: the completion block takes the result first and the error last, the result is `nil` on failure, and the error is non-nil exactly when the result is nil. Breaking this symmetry (e.g. a non-nil result alongside a non-nil error, or an error-first parameter order) forces every caller to write defensive, non-idiomatic handling and blocks Swift's automatic `async throws` bridging for the completion-handler variant.

## Bad

```objc
// Error-first ordering doesn't match Cocoa convention or Swift's completion-handler bridging
- (void)fetchUserWithID:(NSString *)userID
              completion:(void (^)(NSError *_Nullable error, OMWUser *_Nullable user))completion;

// Implementation can hand back inconsistent combinations
- (void)fetchUserWithID:(NSString *)userID
              completion:(void (^)(NSError *_Nullable error, OMWUser *_Nullable user))completion {
    [self.session dataTaskWithRequest:request
                     completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        OMWUser *user = [self parseUser:data];  // May be nil even when error is also nil
        completion(error, user);  // Caller can't tell which field to trust
    }];
}
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

// Result first, error last; nil result <=> non-nil error, and vice versa.
- (void)fetchUserWithID:(NSString *)userID
              completion:(void (^)(OMWUser *_Nullable user, NSError *_Nullable error))completion
    NS_SWIFT_NAME(fetchUser(id:completion:));

NS_ASSUME_NONNULL_END

- (void)fetchUserWithID:(NSString *)userID
              completion:(void (^)(OMWUser *_Nullable user, NSError *_Nullable error))completion {
    NSURLSessionDataTask *task =
        [self.session dataTaskWithRequest:[self requestForUserID:userID]
                        completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        if (error != nil) {
            dispatch_async(dispatch_get_main_queue(), ^{
                completion(nil, error);  // nil result, non-nil error
            });
            return;
        }
        NSError *parseError = nil;
        OMWUser *user = [self parseUser:data error:&parseError];
        dispatch_async(dispatch_get_main_queue(), ^{
            if (user == nil) {
                completion(nil, parseError);
            } else {
                completion(user, nil);  // non-nil result, nil error
            }
        });
    }];
    [task resume];
}
```

## Swift Async Bridging Payoff

```objc
- (void)fetchUserWithID:(NSString *)userID
              completion:(void (^)(OMWUser *_Nullable user, NSError *_Nullable error))completion
    NS_SWIFT_NAME(fetchUser(id:completion:));
```

```swift
// Automatically usable as structured concurrency:
let user = try await client.fetchUser(id: userID)
```

## See Also

- [`err-nserror-out-param`](err-nserror-out-param.md) - The synchronous counterpart of this convention
- [`conc-completion-handler-single-call`](conc-completion-handler-single-call.md) - Guarantee the completion block fires exactly once
- [`anti-nested-block-pyramid`](anti-nested-block-pyramid.md) - Don't nest completion handlers into a callback pyramid
