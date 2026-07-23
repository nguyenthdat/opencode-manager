# conc-completion-handler-single-call

> Guarantee a completion handler is invoked exactly once on every path

## Why It Matters

A completion block that fires twice can trigger a delegate callback twice, double-decrement a `dispatch_group`, or resume the same `NSURLSessionTask` continuation twice (a hard crash under Swift async bridging). A completion block that's never invoked on some early-return path silently hangs the caller - a spinner that never stops, a `dispatch_group_leave` that never happens. Both failure modes are easy to introduce whenever a method has more than one exit point.

## Bad

```objc
- (void)uploadData:(NSData *)data completion:(void (^)(NSError *_Nullable error))completion {
    if (data.length == 0) {
        completion([self emptyDataError]);
        // Missing return - execution falls through to the network call below.
    }

    [self.session uploadTaskWithData:data completionHandler:^(NSData *responseData, NSURLResponse *response, NSError *error) {
        if (error) {
            completion(error);
            return;
        }
        if (![self isSuccessResponse:response]) {
            completion([self serverError]);
            // Also calls completion again below - double invocation.
        }
        completion(nil);
    }];
}
```

## Good

```objc
- (void)uploadData:(NSData *)data completion:(void (^)(NSError *_Nullable error))completion {
    if (data.length == 0) {
        completion([self emptyDataError]);
        return; // Explicit early exit prevents falling through.
    }

    [self.session uploadTaskWithData:data completionHandler:^(NSData *responseData, NSURLResponse *response, NSError *error) {
        if (error) {
            completion(error);
            return;
        }
        if (![self isSuccessResponse:response]) {
            completion([self serverError]);
            return; // Prevents the trailing completion(nil) from also firing.
        }
        completion(nil);
    }];
}
```

## Defending With a Guard Flag for Complex Fan-Out

```objc
// When multiple async paths could plausibly race to call completion,
// an atomic guard makes "exactly once" true even under a bug elsewhere.
- (void)fetchWithTimeout:(NSTimeInterval)timeout completion:(void (^)(OMWUser *_Nullable))completion {
    __block BOOL didComplete = NO;
    dispatch_queue_t guardQueue = dispatch_queue_create("com.omw.fetch.guard", DISPATCH_QUEUE_SERIAL);

    void (^completeOnce)(OMWUser *_Nullable) = ^(OMWUser *_Nullable user) {
        dispatch_async(guardQueue, ^{
            if (didComplete) {
                return;
            }
            didComplete = YES;
            completion(user);
        });
    };

    [self.api fetchUserWithCompletion:completeOnce];

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(timeout * NSEC_PER_SEC)),
                    dispatch_get_main_queue(), ^{
        completeOnce(nil); // Timeout path - harmless if the fetch already completed.
    });
}
```

## Unit-Test the Invariant

```objc
- (void)testCompletionCalledExactlyOnceOnServerError {
    XCTestExpectation *expectation = [self expectationWithDescription:@"completion"];
    __block NSInteger callCount = 0;
    [self.client uploadData:[NSData data] completion:^(NSError *error) {
        callCount++;
    }];
    [self waitForExpectationsWithTimeout:1.0 handler:nil];
    XCTAssertEqual(callCount, 1);
}
```

## See Also

- [`conc-dispatch-group-coordination`](conc-dispatch-group-coordination.md) - Use `dispatch_group_t` to coordinate multiple async operations
- [`err-completion-block-error-convention`](err-completion-block-error-convention.md) - Put the error argument last in completion blocks; nil result on failure
- [`anti-nested-block-pyramid`](anti-nested-block-pyramid.md) - Don't nest completion-handler blocks into a callback pyramid
