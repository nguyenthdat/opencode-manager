# conc-condvar-wait-predicate

> Always wait on a condition variable inside a loop that re-checks the actual predicate, never a bare `if`

## Why It Matters

`pthread_cond_wait` can return even when the condition you're waiting for isn't actually true yet — spurious wakeups are explicitly permitted by POSIX, and multiple waiters can also race to consume the same signaled state. Checking the predicate only once (via `if`) before waiting means a spurious or "stolen" wakeup proceeds with a false assumption.

## Bad

```c
pthread_mutex_lock(&lock);
if (!ready) {                       /* single check: vulnerable to spurious wakeup */
    pthread_cond_wait(&cond, &lock);
}
use(shared_data);                     /* may run even though `ready` never became true */
pthread_mutex_unlock(&lock);
```

## Good

```c
pthread_mutex_lock(&lock);
while (!ready) {                     /* loop re-checks the predicate every time we wake up */
    pthread_cond_wait(&cond, &lock);
}
use(shared_data);
pthread_mutex_unlock(&lock);
```

## Signaling Side

```c
pthread_mutex_lock(&lock);
ready = 1;
pthread_cond_signal(&cond);          /* or pthread_cond_broadcast for multiple waiters */
pthread_mutex_unlock(&lock);
```

## Why the Loop Is Required, Not Optional

Even on platforms without spontaneous spurious wakeups, `pthread_cond_broadcast` wakes every waiter, but only one may find the predicate still true after re-acquiring the lock (another waiter might have consumed the resource first). The `while` loop handles both cases uniformly.

## See Also

- [conc-mutex-protect-shared-state](conc-mutex-protect-shared-state.md) - The lock a condition variable is always paired with
- [conc-once-init-pthread-once](conc-once-init-pthread-once.md) - A related one-time synchronization primitive
- [conc-avoid-deadlock-lock-ordering](conc-avoid-deadlock-lock-ordering.md) - Broader locking discipline
