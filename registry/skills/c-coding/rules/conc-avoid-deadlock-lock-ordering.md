# conc-avoid-deadlock-lock-ordering

> When a thread must hold more than one lock at a time, always acquire them in the same global order everywhere

## Why It Matters

Deadlock occurs when thread A holds lock 1 and waits for lock 2, while thread B holds lock 2 and waits for lock 1 — neither can proceed. This is entirely avoidable by establishing (and documenting) a single, consistent order in which locks are acquired across the whole codebase, so a circular wait can never form.

## Bad

```c
void transfer(struct account *from, struct account *to, int amount) {  /* thread A */
    pthread_mutex_lock(&from->lock);
    pthread_mutex_lock(&to->lock);
    from->balance -= amount;
    to->balance += amount;
    pthread_mutex_unlock(&to->lock);
    pthread_mutex_unlock(&from->lock);
}

/* transfer(a, b, 10) from thread A and transfer(b, a, 5) from thread B at the
 * same time can deadlock: A holds a->lock waiting for b->lock, B holds
 * b->lock waiting for a->lock. */
```

## Good

```c
void transfer(struct account *from, struct account *to, int amount) {
    /* Always lock in a consistent order, e.g. by ascending account id,
     * regardless of which account is logically "from" or "to". */
    struct account *first  = (from->id < to->id) ? from : to;
    struct account *second = (from->id < to->id) ? to : from;

    pthread_mutex_lock(&first->lock);
    pthread_mutex_lock(&second->lock);

    from->balance -= amount;
    to->balance += amount;

    pthread_mutex_unlock(&second->lock);
    pthread_mutex_unlock(&first->lock);
}
```

## Alternative: Try-Lock With Backoff

```c
/* When a consistent global order isn't feasible, use pthread_mutex_trylock
 * and release + retry on failure, rather than blocking indefinitely: */
while (pthread_mutex_trylock(&second_lock) != 0) {
    pthread_mutex_unlock(&first_lock);
    /* brief backoff, then re-acquire both from the top */
    pthread_mutex_lock(&first_lock);
}
```

## See Also

- [conc-mutex-protect-shared-state](conc-mutex-protect-shared-state.md) - Baseline locking discipline
- [conc-condvar-wait-predicate](conc-condvar-wait-predicate.md) - Related synchronization correctness pattern
- [lint-thread-sanitizer](lint-thread-sanitizer.md) - Some TSan-adjacent tools can detect lock-order inversions
