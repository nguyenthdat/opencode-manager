# api-default-member-init

> Use default member initializers

## Why It Matters

Default member initializers (`int count_ = 0;`) state a member's default value once, in the class definition, so every constructor inherits it automatically — instead of repeating `count_(0)` in every constructor's initializer list, which is both repetitive and a common source of "forgot to initialize in this one constructor" bugs.

## Bad

```cpp
class ConnectionPool {
public:
    ConnectionPool() : max_connections_(10), timeout_ms_(5000), retry_count_(3) {}
    ConnectionPool(int max) : max_connections_(max), timeout_ms_(5000), retry_count_(3) {}
    ConnectionPool(int max, int timeout)
        : max_connections_(max), timeout_ms_(timeout), retry_count_(3) {}
    // retry_count_(3) repeated in every constructor — miss it once and the
    // member is default-initialized (garbage for a raw int) instead of 3.
private:
    int max_connections_;
    int timeout_ms_;
    int retry_count_;
};
```

## Good

```cpp
class ConnectionPool {
public:
    ConnectionPool() = default;
    explicit ConnectionPool(int max) : max_connections_(max) {}
    ConnectionPool(int max, int timeout) : max_connections_(max), timeout_ms_(timeout) {}

private:
    int max_connections_ = 10;
    int timeout_ms_ = 5000;
    int retry_count_ = 3;   // Every constructor gets this default automatically
};
```

## Works With Aggregates Too

```cpp
struct RetryPolicy {
    int max_attempts = 3;
    std::chrono::milliseconds backoff = std::chrono::milliseconds(100);
    bool exponential = true;
};

RetryPolicy policy{.max_attempts = 5};   // Designated initializer overrides just one field
```

## See Also

- [api-rule-of-zero-value-types](api-rule-of-zero-value-types.md) - Value type construction more broadly
- [name-constants-kcamel-or-caps](name-constants-kcamel-or-caps.md) - Naming these default constants consistently
- [type-structured-bindings](type-structured-bindings.md) - Reading back multi-member results
