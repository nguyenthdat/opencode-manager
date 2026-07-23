# err-never-ignore-populated-error

> Never pass `NULL` for `error:` and then ignore failure

## Why It Matters

Passing `NULL` for an `NSError **` parameter tells the callee you don't need failure details, but it does not make failures stop happening — it just makes them invisible. A `nil` return value with no error captured leaves you unable to log, retry, or present anything meaningful to the user, and it turns "the file didn't load" into an unexplained downstream crash or blank UI with zero diagnostic trail.

## Bad

```objc
// error: NULL - any failure reason is thrown away
NSData *data = [NSData dataWithContentsOfURL:remoteConfigURL
                                      options:0
                                        error:NULL];

// data may be nil here, and we don't even check for it
NSDictionary *config = [NSJSONSerialization JSONObjectWithData:data
                                                         options:0
                                                           error:NULL];
self.featureFlags = config[@"flags"];  // Crashes later with an unhelpful trace if config is nil
```

## Good

```objc
NSError *readError = nil;
NSData *data = [NSData dataWithContentsOfURL:remoteConfigURL
                                      options:0
                                        error:&readError];
if (data == nil) {
    OMWLogError(@"Failed to read remote config: %@", readError);
    [self applyDefaultFeatureFlags];
    return;
}

NSError *parseError = nil;
NSDictionary *config = [NSJSONSerialization JSONObjectWithData:data
                                                         options:0
                                                           error:&parseError];
if (config == nil) {
    OMWLogError(@"Failed to parse remote config: %@", parseError);
    [self applyDefaultFeatureFlags];
    return;
}
self.featureFlags = config[@"flags"];
```

## When NULL Is Genuinely Acceptable

```objc
// Only pass NULL when the return value alone fully determines the next step
// and no diagnostic information is needed - e.g. a best-effort cache cleanup
// whose failure has no observable effect on behavior.
- (void)pruneCacheDirectoryBestEffort {
    NSFileManager *fm = [NSFileManager defaultManager];
    for (NSURL *fileURL in [self expiredCacheFileURLs]) {
        // We don't act differently on failure and don't need the reason -
        // but this should be a deliberate, documented exception, not the default.
        [fm removeItemAtURL:fileURL error:NULL];
    }
}
```

## See Also

- [`err-nserror-out-param`](err-nserror-out-param.md) - The out-parameter convention this rule protects
- [`anti-ignore-nserror`](anti-ignore-nserror.md) - Don't silently ignore a populated `NSError`
- [`err-check-return-value-first`](err-check-return-value-first.md) - Check the return value even when you do capture the error
