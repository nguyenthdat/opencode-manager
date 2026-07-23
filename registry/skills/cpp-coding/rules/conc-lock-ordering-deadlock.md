# conc-lock-ordering-deadlock

> Establish lock ordering or use `scoped_lock`

## Why It Matters

Deadlock occurs when two threads each hold one lock and wait for the other's: thread A locks mutex 1 then waits for mutex 2, while thread B locks mutex 2 then waits for mutex 1. Neither ever proceeds. This is avoided either by always acquiring multiple locks in the same global order everywhere, or by using `std::scoped_lock`, which acquires multiple mutexes atomically using a deadlock-avoidance algorithm internally.

## Bad

```cpp
void transfer_a_to_b(Account& a, Account& b, int amount) {
    std::lock_guard lock_a(a.mutex);
    std::lock_guard lock_b(b.mutex);   // Locks a then b
    a.balance -= amount;
    b.balance += amount;
}

void transfer_b_to_a(Account& a, Account& b, int amount) {
    std::lock_guard lock_b(b.mutex);
    std::lock_guard lock_a(a.mutex);   // Locks b then a — REVERSED order!
    b.balance -= amount;
    a.balance += amount;
}
// Thread 1 calls transfer_a_to_b(x, y), thread 2 calls transfer_b_to_a(x, y)
// concurrently: classic deadlock.
```

## Good — `scoped_lock`

```cpp
void transfer(Account& from, Account& to, int amount) {
    std::scoped_lock lock(from.mutex, to.mutex);   // Deadlock-free regardless of
    from.balance -= amount;                          // which order callers pass them in
    to.balance += amount;
}
```

## Good — Consistent Global Ordering (When `scoped_lock` Isn't an Option)

```cpp
void transfer(Account& a, Account& b, int amount, bool a_to_b) {
    // Always lock in address order, regardless of logical "from"/"to" direction
    Account& first = (&a < &b) ? a : b;
    Account& second = (&a < &b) ? b : a;
    std::lock_guard lock1(first.mutex);
    std::lock_guard lock2(second.mutex);
    // ... apply the transfer using a_to_b to determine direction ...
}
```

## See Also

- [conc-lock-guard-raii](conc-lock-guard-raii.md) - RAII lock types in general
- [conc-condition-variable-predicate](conc-condition-variable-predicate.md) - Related synchronization pitfalls
- [lint-thread-sanitizer](lint-thread-sanitizer.md) - Detecting races and lock issues at runtime
