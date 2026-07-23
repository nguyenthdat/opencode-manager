# conc-thread-create-join-discipline

> Join or explicitly detach every thread you create; never let a joinable thread outlive your interest in its result silently

## Why It Matters

A joinable `pthread_t` that is never joined or detached leaks OS-level thread resources for the life of the process, and if the creating function returns while relying on stack data the thread still references, the thread accesses freed stack memory. `pthread_join` also is how you retrieve the thread's exit status and guarantee its work has completed before you proceed.

## Bad

```c
void spawn_worker(struct job *job) {
    pthread_t tid;
    pthread_create(&tid, NULL, worker_fn, job);
    /* tid never joined or detached: thread resources leak, and worker_fn may
     * still be running when the caller frees `job` */
}
```

## Good

```c
int run_worker(struct job *job) {
    pthread_t tid;
    int rc = pthread_create(&tid, NULL, worker_fn, job);
    if (rc != 0) {
        return -rc;
    }
    void *result;
    pthread_join(tid, &result);   /* waits for completion, reclaims thread resources */
    return (int)(intptr_t)result;
}
```

## Fire-and-Forget: Detach Explicitly

```c
void spawn_background_task(struct job *job) {
    pthread_t tid;
    pthread_attr_t attr;
    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);
    pthread_create(&tid, &attr, worker_fn, job);   /* resources reclaimed automatically on exit */
    pthread_attr_destroy(&attr);
    /* job must be heap-allocated and owned by worker_fn now, not stack-local to the caller */
}
```

## See Also

- [ptr-no-dangling-return](ptr-no-dangling-return.md) - Related stack-lifetime hazard across threads
- [conc-mutex-protect-shared-state](conc-mutex-protect-shared-state.md) - Synchronizing data the thread touches
- [mem-single-owner-free](mem-single-owner-free.md) - Ownership of data passed into a thread
