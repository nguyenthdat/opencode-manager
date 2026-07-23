# err-cause-chaining

> Chain the original failure with the exception's `cause` parameter

## Why It Matters

When you catch a low-level exception and rethrow a higher-level, more meaningful one without passing the original as `cause`, the stack trace that reaches your logs shows only the new exception — the actual root cause (a SQL timeout, a malformed response body) is gone forever. Kotlin's `Throwable` constructor accepts a `cause` parameter for exactly this, and preserving it costs nothing at the call site.

## Bad

```kotlin
class RepositoryException(message: String) : Exception(message)

fun fetchUser(id: String): User {
    try {
        return database.query("SELECT * FROM users WHERE id = ?", id)
    } catch (e: SQLException) {
        // Original SQLException and its stack trace are discarded
        throw RepositoryException("Failed to fetch user $id")
    }
}
```

## Good

```kotlin
class RepositoryException(message: String, cause: Throwable? = null) : Exception(message, cause)

fun fetchUser(id: String): User {
    try {
        return database.query("SELECT * FROM users WHERE id = ?", id)
    } catch (e: SQLException) {
        throw RepositoryException("Failed to fetch user $id", cause = e)
        // Logs now show the full chain: RepositoryException -> Caused by: SQLException
    }
}
```

## Cause Chaining Also Preserves Async Stack Context

In coroutine code, wrapping the original throwable as `cause` is what lets tools reconstruct the logical call chain across suspension points, since the physical stack trace at the throw site doesn't reflect the full `async`/`await` structure.

```kotlin
suspend fun loadDashboard(userId: String): Dashboard {
    return try {
        coroutineScope {
            val profile = async { fetchProfile(userId) }
            val stats = async { fetchStats(userId) }
            Dashboard(profile.await(), stats.await())
        }
    } catch (e: IOException) {
        throw DashboardLoadException("Failed to load dashboard for $userId", cause = e)
    }
}
```

## See Also

- [`err-custom-exception-hierarchy`](err-custom-exception-hierarchy.md) - domain exceptions should accept a `cause` in their constructor
- [`err-nothing-to-propagate`](err-nothing-to-propagate.md) - sometimes the best option is not wrapping at all
- [`err-no-catch-generic-exception`](err-no-catch-generic-exception.md) - catch specific exceptions before wrapping them
