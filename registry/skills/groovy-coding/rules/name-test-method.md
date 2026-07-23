# name-test-method

> Test methods in Spock: descriptive string labels

## Why It Matters

Spock method names are free-form strings describing the behavior under test. Unlike JUnit's `camelCase` method names, Spock strings support spaces, punctuation, and full sentences, producing self-documenting test reports that stakeholders can read.

## Bad

```groovy
class CalculatorSpec extends spock.lang.Specification {
    def "test1"() {                    // Meaningless
        expect:
        new Calculator().add(2, 3) == 5
    }

    def "add"() {                      // Too vague
        expect:
        new Calculator().add(2, 3) == 5
    }
}
```

## Good

```groovy
class CalculatorSpec extends spock.lang.Specification {
    def "adding two positive numbers returns their sum"() {
        expect:
        new Calculator().add(2, 3) == 5
    }

    def "adding a negative number subtracts from the total"() {
        expect:
        new Calculator().add(10, -3) == 7
    }

    def "division by zero throws ArithmeticException"() {
        when:
        new Calculator().divide(10, 0)

        then:
        thrown(ArithmeticException)
    }
}
```

## See Also

- [test-spock-framework](test-spock-framework.md) - Use Spock for Groovy testing
- [test-given-when-then](test-given-when-then.md) - Follow BDD given/when/then
- [test-data-tables](test-data-tables.md) - Use where blocks with data tables
