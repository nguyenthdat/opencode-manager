# anti-manual-memory-raii-available

> Don't hand-manage memory when RAII suffices

## Why It Matters

Almost every manual memory-management need in application code (dynamic arrays, owned objects, resource handles) is already solved correctly and efficiently by `std::vector`, `std::string`, `unique_ptr`, or `shared_ptr`. Hand-rolling equivalent logic reintroduces bugs (leaks, double-frees, incorrect copy semantics) the standard library has already solved.

## Bad

```cpp
class Buffer {
public:
    explicit Buffer(size_t n) : data_(new int[n]), size_(n) {}
    ~Buffer() { delete[] data_; }
    // Still needs a hand-written copy ctor, copy assignment, move ctor, move
    // assignment to be safe — all reinventing what std::vector already does.
private:
    int* data_;
    size_t size_;
};
```

## Good

```cpp
class Buffer {
public:
    explicit Buffer(size_t n) : data_(n) {}
    // Rule of Zero: std::vector already handles copy/move/destruction correctly
private:
    std::vector<int> data_;
};
```

## See Also

- [mem-vector-over-manual](mem-vector-over-manual.md) - `std::vector` instead of manual dynamic arrays
- [raii-rule-of-zero](raii-rule-of-zero.md) - The general Rule of Zero principle
- [raii-unique-ptr-default](raii-unique-ptr-default.md) - `unique_ptr` for single-object ownership
