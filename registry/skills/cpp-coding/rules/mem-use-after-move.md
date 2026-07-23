# mem-use-after-move

> Don't use an object after `std::move` except to reassign

## Why It Matters

After `std::move(x)` is used to initialize or assign another object, `x` is left in a "valid but unspecified" state — the standard guarantees it's safe to destroy or reassign, but not that any particular value or invariant survives. Reading its contents afterward is a logic bug, and for some types (that don't guarantee "valid but unspecified," like some third-party types) can be outright UB.

## Bad

```cpp
std::vector<int> process(std::vector<int> data) {
    auto backup = std::move(data);
    log(data.size());     // data's state is unspecified — this is a bug, even if
                           // it happens not to crash
    return backup;
}

void enqueue(std::unique_ptr<Task> task) {
    queue_.push_back(std::move(task));
    task->run();   // task is now null — this dereferences a null unique_ptr
}
```

## Good

```cpp
std::vector<int> process(std::vector<int> data) {
    auto backup = std::move(data);
    log(backup.size());   // Use the object that now actually owns the data
    return backup;
}

void enqueue(std::unique_ptr<Task> task) {
    Task* raw = task.get();   // Grab what you need BEFORE moving
    queue_.push_back(std::move(task));
    raw->run();                // Safe: raw is a non-owning view, task ownership
                                // has moved but the object itself is intact
                                // (as long as queue_ doesn't destroy it here)
}
```

## Reassignment After Move Is Always Safe

```cpp
std::string s = "hello";
std::string t = std::move(s);
s = "new value";   // Fine: assignment doesn't depend on prior state
```

## Static Analysis Helps Catch This

```cpp
// clang-tidy's bugprone-use-after-move check flags exactly this pattern.
// Enable it as part of the recommended .clang-tidy baseline.
```

## See Also

- [own-move-transfer](own-move-transfer.md) - Correct use of `std::move` for ownership transfer
- [lint-clang-tidy-baseline](lint-clang-tidy-baseline.md) - Static analysis that catches use-after-move
- [raii-rule-of-five](raii-rule-of-five.md) - Implementing move operations that leave a valid moved-from state
