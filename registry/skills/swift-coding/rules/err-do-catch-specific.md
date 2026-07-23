# err-do-catch-specific

> Catch specific error cases before a generic fallback

## Why It Matters

Ordering `catch` clauses from most specific to least specific — and pattern-matching on the exact case you can meaningfully handle — lets each failure mode get the response it deserves (retry, alternate flow, user message) instead of collapsing every error into the same generic handler. A single catch-all `catch { ... }` at the top silently absorbs every case, including ones a later maintainer adds without realizing they now fall through to the generic path.

## Bad

```swift
do {
    try uploadFile(at: url)
} catch {
    // Every failure — network timeout, disk full, auth expired — gets
    // the exact same unhelpful message and the exact same recovery (none).
    showAlert("Upload failed.")
}
```

## Good

```swift
do {
    try uploadFile(at: url)
} catch UploadError.authExpired {
    try await refreshTokenAndRetry(url)
} catch UploadError.diskFull {
    showAlert("Not enough space to complete the upload.")
} catch let error as URLError where error.code == .timedOut {
    showAlert("The upload timed out. Please check your connection.")
} catch {
    log.error("Unexpected upload failure: \(error)")
    showAlert("Upload failed: \(error.localizedDescription)")
}
```

## Matching on Associated Values and Types

```swift
enum SyncError: Error {
    case conflict(local: Item, remote: Item)
    case rateLimited(retryAfter: TimeInterval)
}

do {
    try sync(item)
} catch SyncError.conflict(let local, let remote) {
    presentConflictResolution(local: local, remote: remote)
} catch SyncError.rateLimited(let retryAfter) {
    scheduleRetry(after: retryAfter)
} catch is DecodingError {
    log.error("Malformed server response during sync")
    showAlert("Server returned unexpected data.")
} catch {
    showAlert("Sync failed: \(error.localizedDescription)")
}
```

Put the most specific, most actionable cases first; keep exactly one generic `catch` at the end as a safety net, and make sure it still surfaces something useful (log + user message), not silence.

## See Also

- [`err-enum-error-type`](err-enum-error-type.md) - define the cases being matched
- [`err-typed-throws`](err-typed-throws.md) - get exhaustive switch checking in catch
- [`err-never-swallow`](err-never-swallow.md) - don't let the generic catch become a black hole
