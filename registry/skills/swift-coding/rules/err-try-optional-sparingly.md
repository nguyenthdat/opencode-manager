# err-try-optional-sparingly

> Use `try?` only when the failure reason is irrelevant

## Why It Matters

`try?` converts any thrown error into `nil`, discarding the specific reason for failure. That's fine when the caller genuinely doesn't care why something failed (e.g. "did this optional cache lookup succeed, yes or no") but it's a trap when the error carries information the caller needs to act correctly — logging, retry decisions, or showing a specific message to the user all become impossible once the error is gone.

## Bad

```swift
func loadUserPreferences() -> Preferences? {
    // If this fails, we have no idea whether it was a missing file,
    // a corrupted file, or a permissions problem — and neither does
    // whoever has to debug a support ticket about it.
    return try? JSONDecoder().decode(Preferences.self, from: readData())
}

func submitOrder(_ order: Order) {
    guard let receipt = try? gateway.charge(order) else {
        showAlert("Something went wrong")   // Unhelpful for a declined card vs. a timeout
        return
    }
    confirm(receipt)
}
```

## Good

```swift
func loadUserPreferences() -> Preferences? {
    do {
        return try JSONDecoder().decode(Preferences.self, from: readData())
    } catch {
        log.error("Failed to load preferences: \(error)")
        return nil
    }
}

func submitOrder(_ order: Order) {
    do {
        let receipt = try gateway.charge(order)
        confirm(receipt)
    } catch PaymentError.cardDeclined {
        showAlert("Your card was declined.")
    } catch PaymentError.timeout {
        showAlert("The request timed out. Please try again.")
    } catch {
        showAlert("Something went wrong: \(error.localizedDescription)")
    }
}
```

## When try? Is the Right Tool

```swift
// The specific failure reason genuinely doesn't change behavior:
// either the cached value parses, or we fall through to a fresh fetch.
let cached = try? JSONDecoder().decode(Item.self, from: cachedData)
let item = cached ?? (try await fetchFreshItem())

// Combined with nil-coalescing for a best-effort default
let icon = (try? loadCustomIcon()) ?? .systemDefault
```

Ask "would I do anything differently if I knew *why* this failed?" If yes, use `do`/`catch`; if no, `try?` is appropriate and saves boilerplate.

## See Also

- [`err-do-catch-specific`](err-do-catch-specific.md) - handle distinct failure reasons explicitly
- [`err-never-swallow`](err-never-swallow.md) - don't let try? become silent error suppression
- [`err-no-force-try`](err-no-force-try.md) - the crash-prone alternative to avoid
