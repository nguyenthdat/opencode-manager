# err-require-precondition

> Use `require()` to validate function arguments

## Why It Matters

`require()` throws `IllegalArgumentException` with a clear message the instant an argument is invalid, right at the API boundary, instead of letting bad input silently propagate and cause a confusing failure three calls deeper. It reads as a precondition contract at the top of the function, which doubles as documentation for callers about what inputs are actually valid.

## Bad

```kotlin
fun withdraw(account: Account, amount: Double) {
    // No validation - a negative amount silently corrupts the balance
    account.balance -= amount
}

fun createSlice(list: List<Int>, start: Int, end: Int): List<Int> {
    return list.subList(start, end)  // Throws a confusing IndexOutOfBoundsException from deep in stdlib
}
```

## Good

```kotlin
fun withdraw(account: Account, amount: Double) {
    require(amount > 0) { "Withdrawal amount must be positive, was $amount" }
    require(amount <= account.balance) { "Insufficient funds: balance=${account.balance}, requested=$amount" }
    account.balance -= amount
}

fun createSlice(list: List<Int>, start: Int, end: Int): List<Int> {
    require(start in 0..end) { "start ($start) must be between 0 and end ($end)" }
    require(end <= list.size) { "end ($end) must not exceed list size (${list.size})" }
    return list.subList(start, end)
}
```

## `require` Throws `IllegalArgumentException` — This Is Caller Error

`require()` signals that the *caller* passed something invalid; it is not meant to be caught and recovered from within the same module — fix the call site instead. Contrast with `check()`, which signals an internal invariant break rather than a bad argument.

```kotlin
fun processPage(pageNumber: Int, pageSize: Int) {
    require(pageNumber >= 1) { "pageNumber must be >= 1" }
    require(pageSize in 1..100) { "pageSize must be between 1 and 100" }
    // ... implementation trusts these are true from here on
}
```

## See Also

- [`err-check-invariant`](err-check-invariant.md) - the internal-state counterpart to `require()`
- [`err-error-unreachable`](err-error-unreachable.md) - for branches that must never be reached at all
- [`type-nothing-return`](type-nothing-return.md) - explains why `require()`'s failure path type-checks anywhere
