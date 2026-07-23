# test-given-when-then

> Follow BDD: `given:` / `when:` / `then:` blocks

## Why It Matters

Spock's `given/when/then` structure enforces clear separation of setup, action, and verification. This makes tests readable as specifications and helps identify what's being tested. The `then:` block also provides power assertions with detailed failure output.

## Bad

```groovy
class OrderSpec extends Specification {
    def "order processing"() {
        def order = new Order(customer: 'Alice')
        order.addItem(new Item(name: 'Widget', price: 10.0))
        order.addItem(new Item(name: 'Gadget', price: 20.0))
        def processor = new OrderProcessor()
        def result = processor.process(order)
        assert result.total == 30.0
        assert result.status == 'CONFIRMED'
        assert result.items.size() == 2
    }
}
```

## Good

```groovy
class OrderSpec extends Specification {
    def "processing an order calculates total and confirms status"() {
        given: "a valid order with items"
        def order = new Order(customer: 'Alice')
        order.addItem(new Item(name: 'Widget', price: 10.0))
        order.addItem(new Item(name: 'Gadget', price: 20.0))
        def processor = new OrderProcessor()

        when: "the order is processed"
        def result = processor.process(order)

        then: "the correct total and status are returned"
        result.total == 30.0
        result.status == 'CONFIRMED'
        result.items.size() == 2
    }
}
```

## Block Descriptions

```groovy
def "user registration creates account and sends email"() {
    given: "a valid registration request"
    def request = new RegistrationRequest(
        email: 'alice@example.com',
        password: 's3cret123'
    )

    and: "a mocked email service"
    def emailService = Mock(EmailService)

    when: "the registration is processed"
    def service = new RegistrationService(emailService)
    def result = service.register(request)

    then: "the account is created"
    result.success
    result.userId != null

    and: "a welcome email is sent"
    1 * emailService.send(
        'alice@example.com',
        'Welcome!',
        _ as String
    )
}
```

## See Also

- [test-data-tables](test-data-tables.md) - Use where blocks with data tables
- [test-mock-interactions](test-mock-interactions.md) - Use Mock/Stub/Spy
- [test-clean-blocks](test-clean-blocks.md) - Keep when blocks single-action
