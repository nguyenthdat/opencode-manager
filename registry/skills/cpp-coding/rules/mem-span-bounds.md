# mem-span-bounds

> Use `std::span` instead of pointer+length pairs

## Why It Matters

Passing a raw pointer and a separate length as two parameters relies on the caller keeping them in sync manually — any mismatch causes a buffer overrun or under-read. `std::span<T>` (C++20) bundles pointer and extent into one type, can be built from arrays/vectors/`std::array` automatically, and (with a debug-hardened standard library) supports bounds-checked access via `.at()`-like debug assertions.

## Bad

```cpp
void process(const int* data, size_t length) {
    for (size_t i = 0; i <= length; ++i) {   // Off-by-one: reads out of bounds!
        std::cout << data[i] << "\n";
    }
}

int arr[10];
process(arr, 20);   // Caller passes the wrong length — nothing catches this
```

## Good

```cpp
#include <span>

void process(std::span<const int> data) {
    for (int v : data) {   // Length is bound to the data; no separate param to mismatch
        std::cout << v << "\n";
    }
}

int arr[10];
process(arr);              // Length inferred automatically as 10
process(std::span(arr, 5)); // Explicit sub-view if a subset length is intended
```

## Sub-Views Without Copies

```cpp
void process_chunk(std::span<const int> data);

std::vector<int> big_buffer(1000);
process_chunk(std::span(big_buffer).subspan(100, 50));  // View into elements [100, 150)
```

## Caution

`std::span` does not own the underlying data and does not extend its lifetime — the same dangling-view hazard as `string_view` applies.

## See Also

- [own-span-view](own-span-view.md) - Broader non-owning-view guidance
- [mem-string-view-borrow](mem-string-view-borrow.md) - The string-specific equivalent
- [mem-avoid-c-style-arrays-decay](mem-avoid-c-style-arrays-decay.md) - Avoiding array decay in interfaces
