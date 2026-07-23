# err-nothing-to-propagate

> Let unexpected exceptions propagate instead of swallowing them

## Why It Matters

A `catch` block that logs and moves on (or does nothing at all) for a genuinely unexpected exception hides bugs from the people who could fix them and lets the program continue in a state its author never designed for. Propagating the exception — by not catching it, or by catching and rethrowing after adding context — keeps failures visible and lets the caller (or the process supervisor) decide how to react.

## Bad

```kotlin
fun updateInventory(itemId: String, delta: Int) {
    try {
        database.execute("UPDATE inventory SET qty = qty + ? WHERE id = ?", delta, itemId)
    } catch (e: SQLException) {
        // Silently ignored - inventory is now wrong and nobody is told
    }
}

fun sendNotification(userId: String, message: String) {
    try {
        notificationService.send(userId, message)
    } catch (e: Exception) {
        println("notification failed")  // Logged to stdout and forgotten, caller thinks it succeeded
    }
}
```

## Good

```kotlin
fun updateInventory(itemId: String, delta: Int) {
    // No catch here - let the caller decide (retry, alert, fail the transaction)
    database.execute("UPDATE inventory SET qty = qty + ? WHERE id = ?", delta, itemId)
}

fun sendNotification(userId: String, message: String) {
    try {
        notificationService.send(userId, message)
    } catch (e: NotificationException) {
        // Catch specifically, add context, and propagate - don't swallow
        throw NotificationDeliveryException("Failed to notify user $userId", cause = e)
    }
}
```

## Deliberate Swallowing Needs A Comment And A Reason

The rare legitimate case — a best-effort side effect (e.g. analytics) that must never break the primary flow — should say so explicitly, not look like an oversight.

```kotlin
fun trackPageView(page: String) {
    try {
        analytics.log(page)
    } catch (e: IOException) {
        // Intentional: analytics failures must never break page rendering
        logger.debug("Analytics logging failed, ignoring", e)
    }
}
```

## See Also

- [`err-no-catch-generic-exception`](err-no-catch-generic-exception.md) - the over-broad catching that enables swallowing
- [`err-cause-chaining`](err-cause-chaining.md) - preserve context when you do rethrow
- [`err-runcatching-pitfalls`](err-runcatching-pitfalls.md) - `runCatching` makes silent swallowing especially easy
