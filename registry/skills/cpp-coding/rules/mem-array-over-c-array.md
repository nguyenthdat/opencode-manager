# mem-array-over-c-array

> Use `std::array` instead of raw C arrays

## Why It Matters

A raw C array decays to a pointer at the first opportunity, losing its size information; `std::array<T, N>` keeps the size as part of the type, provides `.size()`, `.at()`, iterators, and works with the STL's algorithms — all with zero runtime overhead over the C array.

## Bad

```cpp
void fill(int arr[], size_t size) {   // Size not tied to the array; easy to mismatch
    for (size_t i = 0; i < size; ++i) arr[i] = 0;
}

int scores[10];
fill(scores, 20);   // Bug: passes wrong size, out-of-bounds write, nothing catches it

int total(int arr[]) {
    return sizeof(arr) / sizeof(arr[0]);  // WRONG: arr decayed to int*, sizeof(int*) == 8
}
```

## Good

```cpp
#include <array>

template <size_t N>
void fill(std::array<int, N>& arr) {
    arr.fill(0);
}

std::array<int, 10> scores{};
fill(scores);   // Size is part of the type; can't be mismatched

constexpr size_t count(const std::array<int, 10>& arr) {
    return arr.size();   // Always correct: 10
}
```

## Interop With C APIs

```cpp
std::array<char, 256> buffer{};
c_api_fill_buffer(buffer.data(), buffer.size());   // .data() gives the raw pointer when needed
```

## See Also

- [mem-vector-over-manual](mem-vector-over-manual.md) - Dynamic-size equivalent
- [mem-avoid-c-style-arrays-decay](mem-avoid-c-style-arrays-decay.md) - The array-decay problem in general
- [mem-at-vs-brackets](mem-at-vs-brackets.md) - Bounds-checked access via `.at()`
