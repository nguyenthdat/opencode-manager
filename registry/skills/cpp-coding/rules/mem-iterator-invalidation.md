# mem-iterator-invalidation

> Know which operations invalidate iterators

## Why It Matters

Container-modifying operations (insertion, erasure, reallocation) invalidate some or all existing iterators, pointers, and references into that container, depending on the container type. Continuing to use an invalidated iterator is undefined behavior — often a silent crash far from the actual bug.

## Bad

```cpp
std::vector<int> values = {1, 2, 3, 4, 5};

for (auto it = values.begin(); it != values.end(); ++it) {
    if (*it % 2 == 0) {
        values.erase(it);   // Invalidates `it` and everything after it!
    }
}   // `++it` on the next iteration uses an invalidated iterator — UB

std::vector<int> data = {1, 2, 3};
int* p = &data[0];
data.push_back(4);   // May reallocate; p now dangles
std::cout << *p;      // UB
```

## Good

```cpp
std::vector<int> values = {1, 2, 3, 4, 5};

// erase() returns a valid iterator to the next element
for (auto it = values.begin(); it != values.end(); ) {
    if (*it % 2 == 0) {
        it = values.erase(it);
    } else {
        ++it;
    }
}

// Or, since C++20, use the erase-remove idiom via std::erase_if:
std::erase_if(values, [](int v) { return v % 2 == 0; });
```

## Container Invalidation Cheat Sheet

| Container | Insert | Erase |
|---|---|---|
| `std::vector` | May invalidate all (reallocation) | Invalidates erased + all after it |
| `std::deque` | May invalidate all | Invalidates erased + iterators near it |
| `std::list`/`std::map`/`std::set` | Never invalidates existing iterators | Only invalidates the erased element's iterator |
| `std::unordered_map` | May invalidate on rehash | Only invalidates the erased element |

## See Also

- [mem-vector-over-manual](mem-vector-over-manual.md) - `vector` reallocation behavior
- [mem-no-dangling-reference](mem-no-dangling-reference.md) - The broader dangling-reference hazard
- [perf-algorithm-over-handwritten-loop](perf-algorithm-over-handwritten-loop.md) - Algorithm-based patterns that avoid manual iterator bookkeeping
