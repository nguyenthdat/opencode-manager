# anti-empty-catch-swallow

> Don't silently swallow errors in empty `catch` blocks

## Why It Matters

An empty `catch {}` block (or a `catch` that only logs at a level nobody monitors) discards the exact information needed to diagnose a failure: what went wrong, and why. The operation appears to have "succeeded" from the caller's perspective — no exception propagates, no crash occurs — while the actual failure (a save that didn't happen, a sync that silently didn't run) surfaces later as a confusing, disconnected symptom: missing data, stale state, a user-reported bug with no error in sight because the error was thrown away at the source.

## Bad

```swift
func saveDraft(_ draft: Draft) {
    do {
        try persistenceController.save(draft)
    } catch {
        // silently swallowed — the draft appears saved to the caller, but wasn't
    }
}

func syncPendingChanges() {
    for change in pendingChanges {
        try? apply(change)   // try? here discards the error just as completely as an empty catch
    }
}
```

## Good

```swift
func saveDraft(_ draft: Draft) throws {
    do {
        try persistenceController.save(draft)
    } catch {
        Logger.persistence.error("Failed to save draft \(draft.id): \(error)")
        throw DraftError.saveFailed(underlying: error)
    }
}

func syncPendingChanges() async -> [SyncFailure] {
    var failures: [SyncFailure] = []
    for change in pendingChanges {
        do {
            try apply(change)
        } catch {
            Logger.sync.error("Failed to apply change \(change.id): \(error)")
            failures.append(SyncFailure(change: change, error: error))
        }
    }
    return failures   // caller can see and act on exactly what failed
}
```

## When Discarding an Error Is Actually Fine

`try?` or a genuinely empty catch is defensible only when the failure reason is truly irrelevant to every possible caller and a `nil`/no-op result is a completely adequate substitute — e.g., an optional analytics ping where the app's correctness never depends on it succeeding. Even then, prefer a comment stating why the error is intentionally discarded, so a future reader doesn't mistake it for an oversight:

```swift
// Analytics is best-effort; a failure here must never affect the user-facing flow.
try? analytics.track(.screenViewed("profile"))
```

## See Also

- [`err-never-swallow`](err-never-swallow.md) - the positive-form rule this anti-pattern violates
- [`err-try-optional-sparingly`](err-try-optional-sparingly.md) - when `try?` is and isn't appropriate
- [`err-error-context`](err-error-context.md) - attaching context instead of discarding it
- [`err-do-catch-specific`](err-do-catch-specific.md) - catching specific cases instead of one broad, empty catch-all
