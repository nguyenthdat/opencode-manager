# test-mock-time

> Inject a Clock abstraction for time-dependent code

## Why It Matters

Code that calls `std::chrono::system_clock::now()` (or `std::time()`) directly is impossible to test deterministically — a test asserting "this expires after 5 minutes" would need to actually sleep for 5 minutes, or risk flaky timing-dependent behavior. Injecting a `Clock` abstraction lets tests substitute a controllable fake clock and advance time instantly and deterministically.

## Bad

```cpp
class SessionManager {
public:
    bool is_expired(const Session& session) const {
        auto now = std::chrono::system_clock::now();   // Impossible to control in a test
        return now - session.created_at > std::chrono::minutes(5);
    }
};
```

## Good

```cpp
class Clock {
public:
    virtual ~Clock() = default;
    virtual std::chrono::system_clock::time_point now() const = 0;
};

class SystemClock : public Clock {
public:
    std::chrono::system_clock::time_point now() const override {
        return std::chrono::system_clock::now();
    }
};

class SessionManager {
public:
    explicit SessionManager(const Clock& clock) : clock_(clock) {}
    bool is_expired(const Session& session) const {
        return clock_.now() - session.created_at > std::chrono::minutes(5);
    }
private:
    const Clock& clock_;
};

// test file
class FakeClock : public Clock {
public:
    std::chrono::system_clock::time_point now() const override { return current_; }
    void advance(std::chrono::seconds by) { current_ += by; }
private:
    std::chrono::system_clock::time_point current_ = std::chrono::system_clock::now();
};

TEST(SessionManagerTest, ExpiresAfterFiveMinutes) {
    FakeClock clock;
    SessionManager manager(clock);
    Session session{.created_at = clock.now()};

    EXPECT_FALSE(manager.is_expired(session));
    clock.advance(std::chrono::minutes(6));   // Instant, deterministic — no real sleep
    EXPECT_TRUE(manager.is_expired(session));
}
```

## See Also

- [test-gmock-interfaces](test-gmock-interfaces.md) - The general dependency-injection-for-testing pattern
- [doc-thread-safety-contract](doc-thread-safety-contract.md) - Documenting contracts for injected abstractions like this
- [type-strongly-typed-units](type-strongly-typed-units.md) - `std::chrono` types used throughout this example
