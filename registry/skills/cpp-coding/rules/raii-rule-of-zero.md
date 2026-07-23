# raii-rule-of-zero

> Prefer Rule of Zero: let compiler-generated special members do the work

## Why It Matters

If every member already manages its own resource (a `std::string`, `std::vector`, `unique_ptr`), the class needs no user-defined destructor, copy/move constructor, or copy/move assignment operator. The compiler-generated versions are correct, exception-safe, and free of maintenance burden. Writing them by hand only when you actually own a raw resource keeps classes simple and avoids subtle bugs.

## Bad

```cpp
class Config {
public:
    Config(std::string name, std::vector<int> values)
        : name_(std::move(name)), values_(std::move(values)) {}

    // Unnecessary hand-written boilerplate — error-prone and redundant
    Config(const Config& other) : name_(other.name_), values_(other.values_) {}
    Config(Config&& other) noexcept
        : name_(std::move(other.name_)), values_(std::move(other.values_)) {}
    Config& operator=(const Config& other) {
        name_ = other.name_;
        values_ = other.values_;
        return *this;
    }
    Config& operator=(Config&& other) noexcept {
        name_ = std::move(other.name_);
        values_ = std::move(other.values_);
        return *this;
    }
    ~Config() = default;

private:
    std::string name_;
    std::vector<int> values_;
};
```

## Good

```cpp
class Config {
public:
    Config(std::string name, std::vector<int> values)
        : name_(std::move(name)), values_(std::move(values)) {}

    // No destructor, no copy/move members declared.
    // string and vector already provide correct RAII semantics.

private:
    std::string name_;
    std::vector<int> values_;
};
```

## When You Do Need a Custom Destructor

```cpp
// Only when a member is a raw resource (Rule of Five applies here instead)
class RawBuffer {
public:
    explicit RawBuffer(size_t n) : data_(new int[n]), size_(n) {}
    ~RawBuffer() { delete[] data_; }
    // Must also define copy/move ctor and assignment — see raii-rule-of-five
private:
    int* data_;
    size_t size_;
};

// Better: don't hit this case at all — wrap in unique_ptr<int[]> and get Rule of Zero back
class Buffer {
public:
    explicit Buffer(size_t n) : data_(std::make_unique<int[]>(n)), size_(n) {}
private:
    std::unique_ptr<int[]> data_;
    size_t size_;
};
```

## See Also

- [raii-rule-of-five](raii-rule-of-five.md) - Full special-member set when you must manage a raw resource
- [raii-unique-ptr-default](raii-unique-ptr-default.md) - Wrapping raw resources to regain Rule of Zero
- [api-rule-of-zero-value-types](api-rule-of-zero-value-types.md) - Applying Rule of Zero to public API value types
