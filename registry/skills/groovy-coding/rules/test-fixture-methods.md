# test-fixture-methods

> Use `setup()` / `cleanup()` / `setupSpec()` / `cleanupSpec()`

## Why It Matters

Spock's fixture methods run before/after each feature method (`setup`/`cleanup`) or once per specification class (`setupSpec`/`cleanupSpec`). They centralize shared initialization and teardown, eliminating duplicated setup code across feature methods.

## Bad

```groovy
class OrderProcessorSpec extends Specification {
    def "processes valid order"() {
        given: // Repeated setup in every test
        def db = Database.connect('jdbc:h2:mem:test')
        def processor = new OrderProcessor(db)
        def order = new Order(customer: 'Alice')

        when:
        processor.process(order)

        then:
        order.status == 'CONFIRMED'

        cleanup: // Repeated cleanup
        db.close()
    }

    def "rejects empty order"() {
        given: // Same setup duplicated
        def db = Database.connect('jdbc:h2:mem:test')
        def processor = new OrderProcessor(db)
        def order = new Order()

        when:
        processor.process(order)

        then:
        thrown(ValidationException)

        cleanup:
        db.close()
    }
}
```

## Good

```groovy
class OrderProcessorSpec extends Specification {
    Database db
    OrderProcessor processor

    def setup() {                          // Runs before EACH feature method
        db = Database.connect('jdbc:h2:mem:test')
        processor = new OrderProcessor(db)
    }

    def cleanup() {                        // Runs after EACH feature method
        db?.close()
    }

    def setupSpec() {                      // Runs ONCE before all features
        // Heavy shared initialization
        TestDataSeeder.seed()
    }

    def cleanupSpec() {                    // Runs ONCE after all features
        // Shared teardown
        TestDataSeeder.cleanup()
    }

    def "processes valid order"() {
        given:
        def order = new Order(customer: 'Alice')

        when:
        processor.process(order)

        then:
        order.status == 'CONFIRMED'
    }

    def "rejects empty order"() {
        given:
        def order = new Order()

        when:
        processor.process(order)

        then:
        thrown(ValidationException)
    }
}
```

## See Also

- [test-shared-state-cautious](test-shared-state-cautious.md) - Use @Shared sparingly
- [test-given-when-then](test-given-when-then.md) - Follow BDD given/when/then
- [test-spock-framework](test-spock-framework.md) - Use Spock for Groovy testing
