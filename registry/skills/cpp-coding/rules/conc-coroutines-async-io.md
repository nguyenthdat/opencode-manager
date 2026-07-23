# conc-coroutines-async-io

> Use C++20 coroutines for structured async I/O

## Why It Matters

Callback-based async code ("continuation-passing style") nests deeply and scatters logic across disconnected callback bodies, making error handling and control flow hard to follow. C++20 coroutines (`co_await`) let you write async I/O sequentially, top-to-bottom, while the compiler transforms it into the equivalent suspend/resume state machine.

## Bad — Callback Nesting

```cpp
void fetch_user_profile(int user_id, std::function<void(Profile)> callback) {
    fetch_user(user_id, [callback](User user) {
        fetch_avatar(user.avatar_id, [callback, user](Avatar avatar) {
            fetch_preferences(user.id, [callback, user, avatar](Preferences prefs) {
                callback(Profile{user, avatar, prefs});   // Three levels deep,
            });                                             // error handling scattered
        });
    });
}
```

## Good — Coroutines (Requires a Task/Awaitable Type From a Library Like `cppcoro` or a Custom One)

```cpp
Task<Profile> fetch_user_profile(int user_id) {
    User user = co_await fetch_user(user_id);
    Avatar avatar = co_await fetch_avatar(user.avatar_id);
    Preferences prefs = co_await fetch_preferences(user.id);
    co_return Profile{user, avatar, prefs};
}

// Reads top-to-bottom like synchronous code, while still suspending (not
// blocking a thread) at each co_await point.
```

## Generators With `co_yield`

```cpp
Generator<int> fibonacci() {
    int a = 0, b = 1;
    while (true) {
        co_yield a;
        auto next = a + b;
        a = b;
        b = next;
    }
}

for (int value : fibonacci() | std::views::take(10)) {
    std::cout << value << " ";
}
```

## Practical Note

The standard library doesn't ship a general-purpose `Task<T>`/executor — pair coroutines with a library (Boost.Asio's coroutine support, `cppcoro`, or a framework's own async primitives) rather than hand-rolling the awaitable machinery.

## See Also

- [conc-async-future-tasks](conc-async-future-tasks.md) - Simpler alternative for one-off parallel tasks
- [conc-thread-pool-over-raw-threads](conc-thread-pool-over-raw-threads.md) - The executor coroutines typically resume onto
- [mem-lifetime-of-callback-captures](mem-lifetime-of-callback-captures.md) - Lifetime hazards that coroutines can still exhibit
