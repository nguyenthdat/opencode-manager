# mem-lifetime-of-callback-captures

> Don't let lambda captures dangle

## Why It Matters

A lambda that captures by reference (`[&]`) only stores a reference to the captured variable — if the lambda is invoked after that variable's scope has ended (e.g. it's stored and called later, or run asynchronously), the reference is dangling. This is one of the most common lifetime bugs in event-driven and async C++ code.

## Bad

```cpp
std::function<void()> make_callback() {
    int local = 42;
    return [&local] { std::cout << local; };   // Captures a reference to `local`
}   // `local` is destroyed here

void demo() {
    auto cb = make_callback();
    cb();   // Dangling reference — reads freed stack memory
}

void register_async(Widget& widget) {
    async_run([&widget] { widget.update(); });   // If widget is destroyed before
                                                   // async_run's callback fires, UB
}
```

## Good

```cpp
std::function<void()> make_callback() {
    int local = 42;
    return [local] { std::cout << local; };   // Captures a copy — safe
}

void register_async(std::shared_ptr<Widget> widget) {
    async_run([widget] { widget->update(); });  // Shared ownership keeps it alive
}

void register_weak(std::shared_ptr<Widget> widget) {
    std::weak_ptr<Widget> weak = widget;
    async_run([weak] {
        if (auto w = weak.lock()) w->update();   // Safe: checked before use
    });
}
```

## Rule of Thumb

If a lambda might outlive the current scope (stored, queued, passed to another thread), capture by value or by a lifetime-safe smart pointer, never by reference to a local.

## See Also

- [mem-no-dangling-reference](mem-no-dangling-reference.md) - The general dangling-reference hazard
- [conc-thread-pool-over-raw-threads](conc-thread-pool-over-raw-threads.md) - Callbacks crossing thread boundaries
- [own-weak-ptr-break-cycles](own-weak-ptr-break-cycles.md) - `weak_ptr` for safe, non-owning capture
