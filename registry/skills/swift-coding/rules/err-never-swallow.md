# err-never-swallow

> Never silently discard errors in empty `catch` blocks

## Why It Matters

An empty `catch {}` (or `catch { }` with only a comment) turns a real failure into total silence — no log, no user feedback, no metric — which means the failure will resurface later as a confusing, hard-to-reproduce bug report instead of a clear error at the source. Every `catch` should do at least one of: log, show the user something, retry, or explicitly document (with a comment) why doing nothing is genuinely correct.

## Bad

```swift
func saveDraft(_ text: String) {
    do {
        try store.write(text, to: draftURL)
    } catch {
        // Silence. If this fails, the user's draft just vanishes
        // with no indication anything went wrong.
    }
}

func refreshCache() {
    Task {
        try? await cache.reload()   // Failure disappears into try?
    }
}
```

## Good

```swift
func saveDraft(_ text: String) {
    do {
        try store.write(text, to: draftURL)
    } catch {
        log.error("Failed to save draft: \(error)")
        showToast("Draft couldn't be saved. Your changes may be lost.")
    }
}

func refreshCache() {
    Task {
        do {
            try await cache.reload()
        } catch {
            log.warning("Cache refresh failed, will retry on next launch: \(error)")
        }
    }
}
```

## Documenting a Genuinely Intentional No-Op

```swift
func removeTemporaryFile(at url: URL) {
    do {
        try FileManager.default.removeItem(at: url)
    } catch {
        // Intentionally ignored: the file may have already been cleaned up
        // by a previous run, and leaving a stray temp file is harmless.
        // If this starts happening unexpectedly often, add logging.
    }
}
```

The bar is: an empty `catch` is acceptable only when accompanied by a comment explaining specifically why ignoring the error is safe — never as the default because handling it "felt unnecessary."

## See Also

- [`err-do-catch-specific`](err-do-catch-specific.md) - route each failure to the right handling
- [`err-try-optional-sparingly`](err-try-optional-sparingly.md) - try? has the same silent-discard risk
- [`anti-empty-catch-swallow`](anti-empty-catch-swallow.md) - the broader anti-pattern this rule guards against
