# test-gmock-interfaces

> Design mockable interfaces for gMock

## Why It Matters

Testing a class that depends on a slow, non-deterministic, or hard-to-set-up collaborator (a network client, a database, a clock) is much easier if that dependency is expressed as an abstract interface the class depends on, rather than a concrete type it constructs directly — gMock can then generate a controllable mock implementation of that interface for tests.

## Bad — Concrete Dependency, Impossible to Mock

```cpp
class OrderProcessor {
public:
    void process(const Order& order) {
        PaymentGateway gateway;         // Concrete type, constructed directly —
        gateway.charge(order.total());   // every test hits the real payment gateway!
    }
};
```

## Good — Interface + Dependency Injection

```cpp
class PaymentGateway {
public:
    virtual ~PaymentGateway() = default;
    virtual bool charge(double amount) = 0;
};

class OrderProcessor {
public:
    explicit OrderProcessor(PaymentGateway& gateway) : gateway_(gateway) {}
    void process(const Order& order) {
        gateway_.charge(order.total());
    }
private:
    PaymentGateway& gateway_;
};

// test file
class MockPaymentGateway : public PaymentGateway {
public:
    MOCK_METHOD(bool, charge, (double amount), (override));
};

TEST(OrderProcessorTest, ChargesCorrectAmount) {
    MockPaymentGateway mock_gateway;
    EXPECT_CALL(mock_gateway, charge(99.99)).WillOnce(::testing::Return(true));

    OrderProcessor processor(mock_gateway);
    processor.process(Order{.total = 99.99});
}
```

## Keep the Interface Small (Interface Segregation)

```cpp
// Only include methods OrderProcessor actually calls — a large interface
// forces every mock to stub out unused methods (see api-interface-segregation)
```

## See Also

- [api-interface-segregation](api-interface-segregation.md) - Keeping mockable interfaces small and focused
- [test-mock-time](test-mock-time.md) - Applying the same pattern to time-dependent code
- [test-gtest-fixtures](test-gtest-fixtures.md) - Fixtures that set up mocks for reuse across tests
