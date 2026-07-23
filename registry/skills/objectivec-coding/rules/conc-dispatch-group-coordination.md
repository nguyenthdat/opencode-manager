# conc-dispatch-group-coordination

> Use `dispatch_group_t` to coordinate multiple async operations

## Why It Matters

Hand-rolled counters that decrement on each callback and check for zero are easy to get wrong under concurrency - a missed decrement (an exception, an early return, a forgotten call) means the "all done" code never runs, silently hanging a feature. `dispatch_group_t` centralizes this bookkeeping: `dispatch_group_enter`/`dispatch_group_leave` and `dispatch_group_notify` guarantee the completion block fires exactly once, after every entered unit of work has left.

## Bad

```objc
- (void)fetchProfileAndSettingsForUser:(NSString *)userID
                             completion:(void (^)(OMWUser *user, OMWSettings *settings))completion {
    __block NSInteger remaining = 2;
    __block OMWUser *fetchedUser;
    __block OMWSettings *fetchedSettings;

    [self.api fetchUserWithID:userID completion:^(OMWUser *user) {
        fetchedUser = user;
        remaining--;
        // Racy: two callbacks decrementing remaining concurrently, and no
        // guarantee this check happens on a queue where reading remaining is safe.
        if (remaining == 0) {
            completion(fetchedUser, fetchedSettings);
        }
    }];

    [self.api fetchSettingsForUser:userID completion:^(OMWSettings *settings) {
        fetchedSettings = settings;
        remaining--;
        if (remaining == 0) {
            completion(fetchedUser, fetchedSettings); // Could double-fire under a race.
        }
    }];
}
```

## Good

```objc
- (void)fetchProfileAndSettingsForUser:(NSString *)userID
                             completion:(void (^)(OMWUser *user, OMWSettings *settings))completion {
    dispatch_group_t group = dispatch_group_create();
    __block OMWUser *fetchedUser;
    __block OMWSettings *fetchedSettings;

    dispatch_group_enter(group);
    [self.api fetchUserWithID:userID completion:^(OMWUser *user) {
        fetchedUser = user;
        dispatch_group_leave(group);
    }];

    dispatch_group_enter(group);
    [self.api fetchSettingsForUser:userID completion:^(OMWSettings *settings) {
        fetchedSettings = settings;
        dispatch_group_leave(group);
    }];

    // Fires exactly once, only after both enter/leave pairs complete.
    dispatch_group_notify(group, dispatch_get_main_queue(), ^{
        completion(fetchedUser, fetchedSettings);
    });
}
```

## `dispatch_group_async` for Work You Dispatch Yourself

```objc
// When you control the dispatch (rather than an existing async API),
// dispatch_group_async pairs enter/leave with the block automatically.
dispatch_group_t group = dispatch_group_create();
dispatch_queue_t queue = dispatch_get_global_queue(QOS_CLASS_UTILITY, 0);

for (NSURL *fileURL in fileURLs) {
    dispatch_group_async(group, queue, ^{
        [self indexFileAtURL:fileURL];
    });
}

dispatch_group_notify(group, dispatch_get_main_queue(), ^{
    NSLog(@"Indexed %lu files", (unsigned long)fileURLs.count);
});
```

## Waiting Synchronously (Use Sparingly)

```objc
// dispatch_group_wait blocks the calling thread - only appropriate off
// the main thread, e.g. inside a background NSOperation.
dispatch_time_t timeout = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5.0 * NSEC_PER_SEC));
long result = dispatch_group_wait(group, timeout);
if (result != 0) {
    NSLog(@"Timed out waiting for background indexing");
}
```

## See Also

- [`conc-completion-handler-single-call`](conc-completion-handler-single-call.md) - Guarantee a completion handler is invoked exactly once on every path
- [`conc-nsoperationqueue-dependencies`](conc-nsoperationqueue-dependencies.md) - Use `NSOperation`/`NSOperationQueue` for cancellable, dependent work
- [`anti-nested-block-pyramid`](anti-nested-block-pyramid.md) - Don't nest completion-handler blocks into a callback pyramid
