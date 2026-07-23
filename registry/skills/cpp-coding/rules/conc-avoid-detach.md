# conc-avoid-detach

> Avoid `std::thread::detach()`

## Why It Matters

A detached thread runs completely independently, with no way for the rest of the program to join it, cancel it, or even know whether it's still running. If the program (or any object the detached thread references) is destroyed while it's still running, the thread accesses freed memory — a use-after-free that's especially hard to reproduce and debug since it depends on timing.

## Bad

```cpp
void start_background_task(Widget& widget) {
    std::thread([&widget] {
        std::this_thread::sleep_for(std::chrono::seconds(10));
        widget.update();   // If `widget` (or the whole program) is destroyed before
    }).detach();            // this runs, this is a use-after-free with no warning.
}
```

## Good — Keep the Thread Joinable and Track Its Lifetime

```cpp
class BackgroundTask {
public:
    explicit BackgroundTask(Widget& widget)
        : worker_([this, &widget](std::stop_token stop) {
              for (int i = 0; i < 100 && !stop.stop_requested(); ++i) {
                  std::this_thread::sleep_for(std::chrono::milliseconds(100));
              }
              if (!worker_.get_stop_token().stop_requested()) widget.update();
          }) {}
    // ~jthread automatically requests stop and joins — no detach, no leak
private:
    std::jthread worker_;
};
```

## If You Must Fire-and-Forget, Use a Managed Task System Instead

```cpp
// Prefer submitting to a thread pool or task scheduler that owns the
// task's lifetime and can be shut down cleanly, rather than detaching
// a raw thread with no lifecycle management at all.
thread_pool.submit([&widget] { widget.update(); });
```

## See Also

- [conc-jthread-over-thread](conc-jthread-over-thread.md) - `jthread`'s automatic join behavior
- [conc-thread-pool-over-raw-threads](conc-thread-pool-over-raw-threads.md) - Managed task lifetime as the alternative
- [mem-lifetime-of-callback-captures](mem-lifetime-of-callback-captures.md) - The underlying dangling-capture hazard
