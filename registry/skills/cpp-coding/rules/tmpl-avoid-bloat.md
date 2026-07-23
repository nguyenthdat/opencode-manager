# tmpl-avoid-bloat

> Minimize template instantiation bloat

## Why It Matters

Every distinct template argument combination generates a separate instantiation, each contributing its own compiled code to every translation unit that uses it (before the linker deduplicates identical copies). Templates that duplicate large amounts of logic per instantiation bloat binary size and slow compilation; factoring out the type-independent parts into a shared non-template (or a common base) avoids this.

## Bad

```cpp
template <typename T>
class Stack {
public:
    void push(T value) { data_.push_back(std::move(value)); }
    void pop() { data_.pop_back(); }
    T& top() { return data_.back(); }
    bool empty() const { return data_.empty(); }
    size_t size() const { return data_.size(); }   // Identical logic for every T,
                                                      // fully duplicated per instantiation
private:
    std::vector<T> data_;
};

// Stack<int>, Stack<double>, Stack<MyBigType>, Stack<std::string>... each
// generates a full, separate copy of push/pop/empty/size.
```

## Good — Factor Out the Non-Type-Dependent Logic

```cpp
class StackBase {
protected:
    bool empty_impl(size_t size) const noexcept { return size == 0; }
    // Shared, non-templated helper logic lives once, not per-T
};

template <typename T>
class Stack : private StackBase {
public:
    void push(T value) { data_.push_back(std::move(value)); }
    void pop() { data_.pop_back(); }
    T& top() { return data_.back(); }
    bool empty() const { return empty_impl(data_.size()); }
    size_t size() const { return data_.size(); }
private:
    std::vector<T> data_;
};
```

## `Stack<void*>`-Style Erasure for Pointer Types

```cpp
// A common technique: implement the pointer-storing logic once for `void*`,
// and have Stack<T*> for all pointer T delegate to it, since pointer
// representations are uniform regardless of pointee type.
```

## See Also

- [tmpl-explicit-instantiation](tmpl-explicit-instantiation.md) - Controlling instantiation explicitly
- [api-pimpl-abi-stability](api-pimpl-abi-stability.md) - Reducing header-exposed template surface via PIMPL
- [proj-precompiled-headers-large-builds](proj-precompiled-headers-large-builds.md) - Mitigating build-time cost more broadly
