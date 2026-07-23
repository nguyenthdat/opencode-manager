# api-pass-by-value-sink-ref-view

> Decision table for parameter passing

## Why It Matters

Choosing between by-value, `const&`, `&&`, and a view type (`span`/`string_view`) for each parameter affects both correctness (does the function need to own or mutate the argument?) and performance (does it force an unnecessary copy?). A consistent, deliberate decision for each parameter avoids both over-copying and unclear ownership.

## Bad

```cpp
void process(std::string data);              // Copies even for read-only use
void update(const std::string& name, Widget& target);  // Ambiguous: does update()
                                                          // take ownership of name?
std::vector<int> compute(const std::vector<int>& input) {
    std::vector<int> result = input;   // Unnecessary defensive copy
    // ...
    return result;
}
```

## Good — Decision Table

| Situation | Parameter form |
|---|---|
| Read-only, don't need ownership | `const T&` (or `T` for small/trivial types like `int`) |
| Read-only string | `std::string_view` |
| Read-only contiguous range | `std::span<const T>` |
| Function takes ownership (sink) | `T` by value, caller `std::move`s in |
| Function may or may not copy, cheaply movable type | `T` by value, then `std::move` internally |
| In/out mutation, no ownership change | `T&` |
| Optional in/out mutation | `T*` |

```cpp
void process(std::string_view data);          // No copy for read-only use

void store(std::string name) {                // By-value sink: caller decides to
    names_.push_back(std::move(name));         // move or copy at the call site
}

std::vector<int> compute(std::span<const int> input) {
    std::vector<int> result(input.begin(), input.end());
    // ...
    return result;
}
```

## See Also

- [own-pass-by-value-sink](own-pass-by-value-sink.md) - Sink parameters for smart pointers specifically
- [mem-string-view-borrow](mem-string-view-borrow.md) - `string_view` parameters in depth
- [perf-pass-by-const-ref-large](perf-pass-by-const-ref-large.md) - Performance rationale for `const&`
