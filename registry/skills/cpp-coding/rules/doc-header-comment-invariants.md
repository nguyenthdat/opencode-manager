# doc-header-comment-invariants

> Document class invariants near the declaration

## Why It Matters

A class invariant (a condition that must hold true between any two public method calls, e.g. "the cache never exceeds `max_size_` entries") is the contract that every method must preserve — but if it's only implicit in the code, future maintainers can accidentally break it while adding a feature. Writing it down next to the class declaration makes it an explicit, checkable design constraint.

## Bad

```cpp
class BoundedQueue {
public:
    void push(int value);
    int pop();
private:
    std::deque<int> data_;
    size_t max_size_ = 100;
    // Nothing states that data_.size() <= max_size_ must always hold —
    // a future contributor adding a bulk-insert method might easily violate it.
};
```

## Good

```cpp
/// A FIFO queue with a fixed maximum size.
///
/// \invariant `data_.size() <= max_size_` holds after every public method call.
/// When push() would exceed max_size_, the oldest element is evicted first.
class BoundedQueue {
public:
    void push(int value);
    int pop();
private:
    std::deque<int> data_;
    size_t max_size_ = 100;
};
```

## Pairing Documentation With a Debug-Mode Check

```cpp
class BoundedQueue {
public:
    void push(int value) {
        data_.push_back(value);
        if (data_.size() > max_size_) data_.pop_front();
        assert(data_.size() <= max_size_ && "invariant violated");  // Enforced, not just documented
    }
private:
    std::deque<int> data_;
    size_t max_size_ = 100;
};
```

## See Also

- [err-assert-vs-exception](err-assert-vs-exception.md) - Using `assert()` to enforce documented invariants
- [doc-doxygen-public-api](doc-doxygen-public-api.md) - The general documentation standard this extends
- [api-rule-of-zero-value-types](api-rule-of-zero-value-types.md) - Designing types whose invariants are easy to state
