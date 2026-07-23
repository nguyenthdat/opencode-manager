# own-move-transfer

> Use `std::move` to transfer ownership explicitly

## Why It Matters

`std::move` is just a cast to an rvalue reference — it doesn't move anything by itself, but it signals to the compiler (and to readers) "I'm done with this object; you may cannibalize its resources." Explicit `std::move` at ownership-transfer points makes the transfer visible in the code, and avoids an unnecessary copy of move-only or expensive-to-copy types.

## Bad

```cpp
std::vector<std::string> collect_names() {
    std::vector<std::string> names;
    names.push_back("alice");
    names.push_back("bob");
    return names;   // Fine: NRVO/implicit move applies to a local return
}

void store(std::vector<std::string> names) {
    all_names_ = names;   // Copies the whole vector unnecessarily —
                          // `names` is a local parameter, never used again
}
```

## Good

```cpp
void store(std::vector<std::string> names) {
    all_names_ = std::move(names);   // Moves instead of copying; `names` is
                                       // left in a valid-but-unspecified state
}

auto w = std::make_unique<Widget>();
registry.add(std::move(w));   // w is now null; ownership transferred explicitly
```

## Don't `std::move` Things the Compiler Already Moves

```cpp
std::vector<int> make_vec() {
    std::vector<int> v = {1, 2, 3};
    return std::move(v);   // WRONG: this actually disables NRVO in most compilers
                            // and can pessimize the return.
}

std::vector<int> make_vec_correct() {
    std::vector<int> v = {1, 2, 3};
    return v;   // Correct: NRVO or implicit move applies automatically
}
```

## Moved-From State

```cpp
std::string s = "hello";
std::string t = std::move(s);
// s is now valid but unspecified — you may assign to it or destroy it,
// but must not assume anything about its contents (e.g. that it's empty).
s = "reset";   // OK: reassignment after move is always safe
```

## See Also

- [mem-use-after-move](mem-use-after-move.md) - What "moved-from" state actually guarantees
- [own-pass-by-value-sink](own-pass-by-value-sink.md) - Sink parameters that require `std::move` at the call site
- [perf-move-semantics](perf-move-semantics.md) - Move semantics for performance more broadly
