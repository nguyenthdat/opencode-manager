# conc-avoid-blocking-main-thread

> Never perform synchronous network/disk I/O on the main thread

## Why It Matters

The main thread also drives the run loop that services touch events and screen updates; blocking it on a synchronous network request or a large disk read means the app cannot draw a frame or respond to input until the I/O completes. Past roughly 5 seconds unresponsive, watchdog (iOS) or the "spinning beachball" experience (macOS) results in the app being killed or the user force-quitting it - and even short blocking calls (tens of milliseconds) show up as dropped frames.

## Bad

```objc
- (void)viewDidLoad {
    [super viewDidLoad];
    // Synchronous network fetch on the main thread - blocks the run loop
    // for however long the round-trip takes.
    NSURL *url = [NSURL URLWithString:@"https://api.example.com/profile"];
    NSData *data = [NSData dataWithContentsOfURL:url]; // Blocking I/O.
    self.profile = [self parseProfileFromData:data];
    [self.tableView reloadData];
}

- (NSDictionary *)loadCachedSettings {
    // Large plist read directly on the caller's thread - fine if this is
    // background, but this method is invoked from -applicationDidBecomeActive:.
    NSString *path = [self settingsFilePath];
    return [NSDictionary dictionaryWithContentsOfFile:path];
}
```

## Good

```objc
- (void)viewDidLoad {
    [super viewDidLoad];
    NSURL *url = [NSURL URLWithString:@"https://api.example.com/profile"];
    NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithURL:url
        completionHandler:^(NSData *_Nullable data, NSURLResponse *_Nullable response, NSError *_Nullable error) {
        OMWProfile *profile = [self parseProfileFromData:data];
        dispatch_async(dispatch_get_main_queue(), ^{
            self.profile = profile;
            [self.tableView reloadData];
        });
    }];
    [task resume];
}

- (void)loadCachedSettingsWithCompletion:(void (^)(NSDictionary *_Nullable settings))completion {
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{
        NSString *path = [self settingsFilePath];
        NSDictionary *settings = [NSDictionary dictionaryWithContentsOfFile:path];
        dispatch_async(dispatch_get_main_queue(), ^{
            completion(settings);
        });
    });
}
```

## Detecting Main-Thread Stalls in Development

```objc
// A lightweight main-thread watchdog for debug builds: logs a warning
// (via a background ping timer) whenever the main queue fails to
// process a heartbeat block within a threshold.
dispatch_queue_t watchdogQueue = dispatch_queue_create("com.omw.watchdog", DISPATCH_QUEUE_SERIAL);
dispatch_source_t timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, watchdogQueue);
dispatch_source_set_timer(timer, DISPATCH_TIME_NOW, 1 * NSEC_PER_SEC, 0.1 * NSEC_PER_SEC);
dispatch_source_set_event_handler(timer, ^{
    __block BOOL responded = NO;
    dispatch_async(dispatch_get_main_queue(), ^{ responded = YES; });
    dispatch_time_t deadline = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.25 * NSEC_PER_SEC));
    dispatch_after(deadline, watchdogQueue, ^{
        if (!responded) {
            NSLog(@"WARNING: main thread unresponsive for >250ms");
        }
    });
});
dispatch_resume(timer);
```

## Rare Exceptions

Extremely small, guaranteed-fast reads (e.g. a single `NSUserDefaults` read, which is memory-mapped and effectively synchronous already) are fine on the main thread. The rule targets I/O whose latency is unbounded or network-dependent - anything touching a socket, an unbounded-size file, or a remote service must never block the main thread.

## See Also

- [`conc-main-queue-ui-updates`](conc-main-queue-ui-updates.md) - Always dispatch UI updates back to the main queue
- [`conc-avoid-priority-inversion`](conc-avoid-priority-inversion.md) - Avoid blocking high-priority queues on low-priority/background work
- [`perf-decode-image-off-main`](perf-decode-image-off-main.md) - Decode/resize images off the main thread
