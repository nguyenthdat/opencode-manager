# anti-ignore-nserror

> Don't silently ignore a populated `NSError`

## Why It Matters

Cocoa's `NSError **` convention only guarantees the error is populated on failure — it says nothing about what happens if you ignore it. Passing `nil` for the error parameter, or checking it but doing nothing with it, means a write that failed to disk, a network request that failed validation, or a Core Data save that violated a constraint all fail invisibly: the caller proceeds as if everything succeeded, and the user finds out only when downstream state is already corrupted.

## Bad

```objc
// Passing NULL discards any diagnostic information entirely.
[fileManager removeItemAtURL:cacheFileURL error:NULL];
```

```objc
// Error is captured but never inspected or acted on -- functionally
// identical to passing NULL, just with extra ceremony.
NSError *error;
[self.managedObjectContext save:&error];
// Execution continues as if the save succeeded, even if it didn't.
[self dismissViewControllerAnimated:YES completion:nil];
```

## Good

```objc
NSError *error;
BOOL removed = [fileManager removeItemAtURL:cacheFileURL error:&error];
if (!removed) {
    OMWLogError(@"Failed to remove cache file %@: %@", cacheFileURL, error);
    // Decide deliberately: retry, surface to the user, or treat as
    // non-fatal -- but the decision is explicit, not accidental.
}
```

```objc
NSError *error;
BOOL saved = [self.managedObjectContext save:&error];
if (!saved) {
    OMWLogError(@"Core Data save failed: %@", error);
    [self presentSaveFailureAlertWithError:error];
    return;
}
[self dismissViewControllerAnimated:YES completion:nil];
```

## The Compiler Cannot Catch This For You

```objc
// The BOOL/nil return value is the real success signal -- *not* just
// whether *error was set. Checking only the error variable without
// checking the return value has the same failure mode as ignoring it,
// because some APIs leave *error untouched on success paths that still
// warrant checking the return value.
NSError *error = nil;
NSData *data = [NSData dataWithContentsOfURL:url options:0 error:&error];
if (data == nil) {          // Check the primary return value first.
    OMWLogError(@"Failed to read %@: %@", url, error);
    return;
}
```

## See Also

- [`err-never-ignore-populated-error`](err-never-ignore-populated-error.md) - Never pass `NULL` for `error:` and then ignore failure
- [`err-check-return-value-first`](err-check-return-value-first.md) - Check the BOOL/nil return value, not just whether an error was set
- [`err-nested-error-wrapping`](err-nested-error-wrapping.md) - Wrap underlying errors via `NSUnderlyingErrorKey` instead of discarding them
