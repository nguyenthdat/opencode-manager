# err-noexcept-correctness

> Mark move operations `noexcept`

## Why It Matters

`std::vector` and other containers check at compile time whether a type's move constructor is `noexcept`. If it is, reallocation moves elements (fast); if it isn't, the container falls back to copying elements (slow) to preserve the strong exception guarantee during reallocation. An un-annotated but actually-non-throwing move constructor silently costs performance across the whole codebase.

## Bad

```cpp
class Buffer {
public:
    Buffer(Buffer&& other) : data_(other.data_), size_(other.size_) {
        other.data_ = nullptr;
    }   // Never throws, but isn't marked noexcept
    // ...
private:
    int* data_;
    size_t size_;
};

std::vector<Buffer> buffers;
buffers.push_back(Buffer{});
buffers.push_back(Buffer{});   // Reallocation COPIES existing Buffers instead
                                 // of moving them, because the compiler can't
                                 // prove the move won't throw.
```

## Good

```cpp
class Buffer {
public:
    Buffer(Buffer&& other) noexcept
        : data_(std::exchange(other.data_, nullptr)),
          size_(std::exchange(other.size_, 0)) {}

    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            delete[] data_;
            data_ = std::exchange(other.data_, nullptr);
            size_ = std::exchange(other.size_, 0);
        }
        return *this;
    }
private:
    int* data_;
    size_t size_;
};

std::vector<Buffer> buffers;
buffers.push_back(Buffer{});
buffers.push_back(Buffer{});   // Reallocation now moves — fast, and correctly
                                 // provides the strong guarantee via noexcept move.
```

## Also Mark Other Non-Throwing Functions

```cpp
bool empty() const noexcept { return size_ == 0; }
void swap(Buffer& other) noexcept { /* ... */ }
~Buffer() noexcept = default;   // Destructors are implicitly noexcept anyway,
                                  // but this documents intent explicitly.
```

## See Also

- [raii-rule-of-five](raii-rule-of-five.md) - Move operations in the full Rule of Five
- [raii-exception-safety-dtor](raii-exception-safety-dtor.md) - Destructors and `noexcept`
- [err-strong-exception-guarantee](err-strong-exception-guarantee.md) - How `noexcept` move enables the strong guarantee
