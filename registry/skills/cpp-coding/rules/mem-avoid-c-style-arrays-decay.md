# mem-avoid-c-style-arrays-decay

> Avoid array-to-pointer decay in interfaces

## Why It Matters

A C array parameter like `int arr[]` is actually just `int*` — the array's size is silently discarded at the function boundary ("array decay"), and `sizeof(arr)` inside the function returns the pointer size, not the array size. This makes it easy to write code that looks size-aware but isn't.

## Bad

```cpp
void print_all(int arr[], int size) {
    // size must be passed separately and kept in sync manually — decay already
    // discarded the real array size before this function ever saw it
    for (int i = 0; i < size; ++i) std::cout << arr[i] << " ";
}

template <typename T>
void bad_size(T arr[]) {
    std::cout << sizeof(arr);   // Always sizeof(T*), NOT the array's byte size!
}
```

## Good

```cpp
#include <span>

void print_all(std::span<const int> data) {
    for (int v : data) std::cout << v << " ";   // Size travels with the view
}

template <typename T, size_t N>
void print_fixed(const T (&arr)[N]) {   // Reference-to-array preserves N
    std::cout << "size: " << N << "\n";
    for (const T& v : arr) std::cout << v << " ";
}

int values[5] = {1, 2, 3, 4, 5};
print_all(values);     // std::span deduces size 5 automatically
print_fixed(values);   // N deduced as 5 at compile time
```

## Prefer `std::array`/`std::vector`/`std::span` Entirely

```cpp
// Once containers/views are used consistently, array decay simply doesn't arise.
void print_all(const std::vector<int>& data);
void print_all(std::span<const int> data);
```

## See Also

- [mem-span-bounds](mem-span-bounds.md) - `std::span` as the fix for this problem
- [mem-array-over-c-array](mem-array-over-c-array.md) - Avoiding raw arrays altogether
- [own-span-view](own-span-view.md) - Non-owning views as function parameters
