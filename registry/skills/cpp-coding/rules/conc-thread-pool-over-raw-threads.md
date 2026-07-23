# conc-thread-pool-over-raw-threads

> Use a thread pool, not raw threads per task

## Why It Matters

Spawning a new OS thread per task has real, measurable overhead (stack allocation, kernel scheduling registration) and, unbounded, can exhaust system resources under high task volume. A thread pool creates a fixed set of worker threads once and reuses them for many tasks, amortizing that cost and bounding resource usage.

## Bad

```cpp
void handle_requests(std::vector<Request> requests) {
    std::vector<std::jthread> threads;
    for (auto& req : requests) {
        threads.emplace_back([&req] { process(req); });   // One OS thread per request —
    }                                                        // unbounded under load spikes
}
```

## Good — A Simple Thread Pool

```cpp
class ThreadPool {
public:
    explicit ThreadPool(size_t n) {
        for (size_t i = 0; i < n; ++i) {
            workers_.emplace_back([this] { worker_loop(); });
        }
    }

    ~ThreadPool() {
        { std::lock_guard lock(mutex_); stop_ = true; }
        cv_.notify_all();
    }

    void submit(std::function<void()> task) {
        { std::lock_guard lock(mutex_); tasks_.push(std::move(task)); }
        cv_.notify_one();
    }

private:
    void worker_loop() {
        while (true) {
            std::function<void()> task;
            {
                std::unique_lock lock(mutex_);
                cv_.wait(lock, [this] { return stop_ || !tasks_.empty(); });
                if (stop_ && tasks_.empty()) return;
                task = std::move(tasks_.front());
                tasks_.pop();
            }
            task();
        }
    }

    std::vector<std::jthread> workers_;
    std::queue<std::function<void()>> tasks_;
    std::mutex mutex_;
    std::condition_variable cv_;
    bool stop_ = false;
};

ThreadPool pool(std::thread::hardware_concurrency());
for (auto& req : requests) {
    pool.submit([&req] { process(req); });
}
```

## Prefer a Well-Tested Library Over Hand-Rolling in Production

```cpp
// Consider Boost.Asio's thread_pool, Intel TBB's task_arena, or a
// project-vetted executor instead of maintaining a custom implementation.
```

## See Also

- [conc-jthread-over-thread](conc-jthread-over-thread.md) - `jthread` used as the worker type above
- [conc-condition-variable-predicate](conc-condition-variable-predicate.md) - The wait predicate pattern used in the worker loop
- [conc-async-future-tasks](conc-async-future-tasks.md) - Simpler alternative for occasional, independent tasks
