# err-check-invariant

> Use `check()` to validate internal object/state invariants

## Why It Matters

`check()` throws `IllegalStateException`, signaling "this object's own internal state is inconsistent," which is a different failure category from `require()`'s "the caller passed bad arguments." Distinguishing the two in code makes stack traces self-documenting: an `IllegalStateException` immediately tells the next engineer to look at the object's lifecycle and mutation order, not at the call site's arguments.

## Bad

```kotlin
class ConnectionPool {
    private var connection: Connection? = null

    fun open() {
        connection = Connection.create()
    }

    fun query(sql: String): ResultSet {
        // No state check - fails deep inside execute() with an unrelated NPE
        return connection!!.execute(sql)
    }
}
```

## Good

```kotlin
class ConnectionPool {
    private var connection: Connection? = null

    fun open() {
        connection = Connection.create()
    }

    fun query(sql: String): ResultSet {
        val conn = connection
        check(conn != null) { "ConnectionPool.query() called before open()" }
        return conn.execute(sql)
    }
}

// checkNotNull combines the null check and the message in one call
class Session {
    private var token: String? = null

    fun authenticatedCall(): Response {
        val currentToken = checkNotNull(token) { "Session used before login()" }
        return api.call(currentToken)
    }
}
```

## `require` vs `check` — Choosing The Right One

```kotlin
fun transfer(from: Account, to: Account, amount: Double) {
    require(amount > 0) { "amount must be positive" }       // Caller's fault: bad argument
    check(from.isUnlocked) { "source account is locked" }   // Object's own state is invalid
    from.balance -= amount
    to.balance += amount
}
```

## See Also

- [`err-require-precondition`](err-require-precondition.md) - the argument-validation counterpart
- [`err-error-unreachable`](err-error-unreachable.md) - for conditions stronger than "invalid," i.e. impossible
- [`type-avoid-not-null-assert`](type-avoid-not-null-assert.md) - `checkNotNull` is a descriptive alternative to `!!`
