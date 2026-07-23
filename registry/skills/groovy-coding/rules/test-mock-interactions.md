# test-mock-interactions

> Use `Mock` / `Stub` / `Spy` with interaction checking

## Why It Matters

Spock's built-in mocking supports interaction-based testing — verifying not just return values but also that methods were called with expected arguments, the right number of times. This catches missing calls and unexpected invocations that value-based assertions can't detect.

## Bad

```groovy
class OrderServiceSpec extends Specification {
    def "order saves and notifies"() {
        given:
        def repo = new FakeRepository()    // Hand-rolled fake
        def notifier = new FakeNotifier()  // Manual stub
        def service = new OrderService(repo, notifier)

        when:
        service.placeOrder(order)

        then:
        repo.savedOrder == order           // Doesn't verify call count
        // Was notifier called? No way to check!
    }
}
```

## Good

```groovy
class OrderServiceSpec extends Specification {
    def "order saves and notifies"() {
        given:
        def repo = Mock(OrderRepository)
        def notifier = Mock(NotificationService)
        def service = new OrderService(repo, notifier)

        when:
        service.placeOrder(order)

        then:
        1 * repo.save(order)                         // Called exactly once
        1 * notifier.send(
            order.customer.email,
            'Order Confirmed',
            { it.contains(order.id.toString()) }      // Argument constraint
        )
        0 * notifier.send(_, 'Error', _)              // Never called with 'Error'
    }
}
```

## Interaction Patterns

```groovy
// Cardinality
1 * service.method()       // Exactly once
(1..3) * service.method()  // 1 to 3 times
(2.._) * service.method()  // At least 2 times
(_..5) * service.method()  // At most 5 times
0 * service.method()       // Never
_ * service.method()       // Any number (including 0)

// Argument constraints
1 * service.process('exact')              // Exact match
1 * service.process(_ as String)          // Any String
1 * service.process(!null)                // Not null
1 * service.process({ it.startsWith('A') }) // Custom matcher
1 * service.process(_)                    // Any argument
_ * service.process(*_)                   // Any arguments (variable)

// Return values
def stub = Stub(Service)
stub.getData() >> [1, 2, 3]              // Fixed return
stub.getData() >>> [1, 2, 3]             // Sequential returns
stub.getData() >> { args -> args[0] * 2 } // Dynamic return
```

## See Also

- [test-given-when-then](test-given-when-then.md) - Follow BDD given/when/then
- [test-spock-framework](test-spock-framework.md) - Use Spock for Groovy testing
- [test-clean-blocks](test-clean-blocks.md) - Keep when blocks single-action
