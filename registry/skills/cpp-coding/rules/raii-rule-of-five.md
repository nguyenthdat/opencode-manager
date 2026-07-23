# raii-rule-of-five

> Implement all five special members together when managing a resource manually

## Why It Matters

If a class manages a raw resource directly (needs a user-defined destructor), the compiler-generated copy constructor and copy assignment operator will do a shallow copy, causing double-free or use-after-free. Declaring only some of the five special members (destructor, copy ctor, copy assign, move ctor, move assign) leaves the others either deleted or dangerously defaulted. Declare all five, or none (Rule of Zero).

## Bad

```cpp
class Buffer {
public:
    explicit Buffer(size_t n) : data_(new int[n]), size_(n) {}
    ~Buffer() { delete[] data_; }
    // No copy ctor/assignment declared — compiler generates shallow-copy
    // versions that double-free data_ when two Buffers point at the same array.
private:
    int* data_;
    size_t size_;
};

void demo() {
    Buffer a(10);
    Buffer b = a;   // Shallow copy: b.data_ == a.data_
}                   // Both destructors delete[] the same pointer — UB
```

## Good

```cpp
class Buffer {
public:
    explicit Buffer(size_t n) : data_(new int[n]), size_(n) {}

    ~Buffer() { delete[] data_; }

    Buffer(const Buffer& other) : data_(new int[other.size_]), size_(other.size_) {
        std::copy(other.data_, other.data_ + size_, data_);
    }

    Buffer& operator=(const Buffer& other) {
        if (this == &other) return *this;
        auto tmp = std::make_unique<int[]>(other.size_);
        std::copy(other.data_, other.data_ + other.size_, tmp.get());
        delete[] data_;
        data_ = tmp.release();
        size_ = other.size_;
        return *this;
    }

    Buffer(Buffer&& other) noexcept
        : data_(std::exchange(other.data_, nullptr)), size_(std::exchange(other.size_, 0)) {}

    Buffer& operator=(Buffer&& other) noexcept {
        if (this == &other) return *this;
        delete[] data_;
        data_ = std::exchange(other.data_, nullptr);
        size_ = std::exchange(other.size_, 0);
        return *this;
    }

private:
    int* data_;
    size_t size_;
};
```

## Preferred: Avoid the Raw Resource Entirely

```cpp
// Regain Rule of Zero by delegating to a container that already implements
// the Rule of Five correctly.
class Buffer {
public:
    explicit Buffer(size_t n) : data_(n) {}
private:
    std::vector<int> data_;
};
```

## See Also

- [raii-rule-of-zero](raii-rule-of-zero.md) - Preferred alternative: own no raw resources
- [own-move-transfer](own-move-transfer.md) - `std::move`/`std::exchange` in move operations
- [err-noexcept-correctness](err-noexcept-correctness.md) - Move operations should be `noexcept`
