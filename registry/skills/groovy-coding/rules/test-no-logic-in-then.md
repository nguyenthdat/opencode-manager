# test-no-logic-in-then

> Don't put complex logic in `then:` blocks

## Why It Matters

`then:` blocks should contain only assertions — boolean expressions that Spock can report as pass/fail with power assertions. Complex logic, variable assignments, or method calls in `then:` make test failures opaque and can mask assertion failures.

## Bad

```groovy
def "order total calculation"() {
    given:
    def order = new Order()
    order.addItem(new Item(price: 10.0, quantity: 2))
    order.addItem(new Item(price: 5.0, quantity: 3))

    when:
    def result = order.calculateTotal()

    then:
    def expected = (10.0 * 2) + (5.0 * 3)  // Logic in then! Not an assertion
    def rounded = Math.round(result * 100) / 100.0  // Complex computation
    rounded == 35.0

    // If the logic has a bug, the test might pass incorrectly
}
```

## Good

```groovy
def "order total calculation"() {
    given:
    def order = new Order()
    order.addItem(new Item(price: 10.0, quantity: 2))
    order.addItem(new Item(price: 5.0, quantity: 3))

    when:
    def result = order.calculateTotal()

    then:
    result == 35.0
}

// Complex expectations — compute in given or when
def "order total with tax"() {
    given:
    def order = new Order()
    order.addItem(new Item(price: 100.0, quantity: 1))
    def taxRate = 0.10
    def expectedTotal = 100.0 * (1 + taxRate)   // Compute in given

    when:
    def result = order.calculateTotalWithTax(taxRate)

    then:
    result == expectedTotal    // Pure assertion
}
```

## See Also

- [test-given-when-then](test-given-when-then.md) - Follow BDD given/when/then
- [test-clean-blocks](test-clean-blocks.md) - Keep when blocks single-action
- [test-data-tables](test-data-tables.md) - Use where blocks with data tables
