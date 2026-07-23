# conc-async-future-tasks

> Use `std::async`/`std::future` for simple parallelism

## Why It Matters

For a one-off "run this computation in parallel and collect the result later" task, `std::async` handles thread creation (or thread-pool dispatch, implementation-defined), result transport, and exception propagation automatically via `std::future`, without the boilerplate of manually spawning a thread and synchronizing a shared result variable.

## Bad

```cpp
int result = 0;
std::exception_ptr error;
std::thread worker([&] {
    try {
        result = compute_expensive();
    } catch (...) {
        error = std::current_exception();   // Manual exception transport
    }
});
worker.join();
if (error) std::rethrow_exception(error);
use(result);
```

## Good

```cpp
std::future<int> future = std::async(std::launch::async, compute_expensive);

// Do other work here while compute_expensive() runs concurrently...

int result = future.get();   // Blocks until ready; rethrows any exception automatically
use(result);
```

## Running Several Tasks in Parallel

```cpp
std::future<int> f1 = std::async(std::launch::async, compute_part1);
std::future<int> f2 = std::async(std::launch::async, compute_part2);

int total = f1.get() + f2.get();   // Both run concurrently; results combined once both are ready
```

## Caution: Always Specify `std::launch::async`

```cpp
// Without an explicit policy, std::async may choose std::launch::deferred,
// which runs the task lazily on .get() -- on the CALLING thread, not
// concurrently at all. Be explicit if concurrency is the actual intent.
auto f = std::async(compute_expensive);              // Policy is implementation-defined!
auto f2 = std::async(std::launch::async, compute_expensive);  // Explicit: always concurrent
```

## See Also

- [conc-thread-pool-over-raw-threads](conc-thread-pool-over-raw-threads.md) - For many tasks, prefer a thread pool over repeated `std::async`
- [err-catch-by-const-ref](err-catch-by-const-ref.md) - Exception handling once propagated via `future::get()`
- [conc-jthread-over-thread](conc-jthread-over-thread.md) - When you need explicit thread control instead
