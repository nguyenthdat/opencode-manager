# mem-vector-over-manual

> Use `std::vector` instead of manual dynamic arrays

## Why It Matters

Manually managed dynamic arrays (`new T[n]` / `delete[]`, or realloc-based growth) require hand-written bounds tracking, capacity growth, copy/move semantics, and exception safety — all of which `std::vector` already implements correctly, and typically with better-optimized growth strategies than a hand-rolled version.

## Bad

```cpp
class IntList {
public:
    IntList() : data_(new int[4]), capacity_(4), size_(0) {}
    ~IntList() { delete[] data_; }

    void push(int value) {
        if (size_ == capacity_) {
            capacity_ *= 2;
            int* new_data = new int[capacity_];   // If this throws, data_ is fine,
            std::copy(data_, data_ + size_, new_data);  // but this is easy to get wrong
            delete[] data_;
            data_ = new_data;
        }
        data_[size_++] = value;
    }
    // Still need to hand-write copy ctor, copy assign, move ctor, move assign...
private:
    int* data_;
    size_t capacity_;
    size_t size_;
};
```

## Good

```cpp
#include <vector>

std::vector<int> list;
list.push_back(value);   // Growth, bounds, RAII, copy/move all handled correctly
```

## When a Custom Container Is Still Justified

```cpp
// Only build a custom container when std::vector's growth/allocation strategy
// genuinely doesn't fit (e.g. a lock-free ring buffer, or an embedded target
// with no dynamic allocation allowed). Even then, prefer std::array or a
// well-tested library (e.g. boost::circular_buffer) over hand-rolling one.
```

## See Also

- [mem-array-over-c-array](mem-array-over-c-array.md) - Fixed-size equivalent
- [perf-reserve-known-size](perf-reserve-known-size.md) - Pre-sizing `vector` for performance
- [raii-rule-of-zero](raii-rule-of-zero.md) - Why using `vector` regains Rule of Zero
