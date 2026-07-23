# test-spock-framework

> Use Spock for Groovy testing

## Why It Matters

Spock is the de facto testing framework for Groovy, providing BDD-style specifications with `given/when/then` blocks, built-in mocking, data-driven testing, and powerful assertions. It's more expressive and Groovy-idiomatic than JUnit, producing human-readable test reports.

## Bad

```groovy
import org.junit.jupiter.api.Test
import static org.junit.jupiter.api.Assertions.*

class CalculatorTest {
    @Test
    void testAdd() {
        Calculator calc = new Calculator()
        int result = calc.add(2, 3)
        assertEquals(5, result)          // Error message is generic
    }

    @Test
    void testDivideByZero() {
        Calculator calc = new Calculator()
        try {
            calc.divide(10, 0)
            fail("Expected exception")
        } catch (ArithmeticException e) {
            assertEquals("/ by zero", e.message)
        }
    }
}
```

## Good

```groovy
import spock.lang.Specification

class CalculatorSpec extends Specification {
    def "adding two numbers returns their sum"() {
        given:
        def calc = new Calculator()

        when:
        def result = calc.add(2, 3)

        then:
        result == 5
    }

    def "division by zero throws exception"() {
        given:
        def calc = new Calculator()

        when:
        calc.divide(10, 0)

        then:
        def e = thrown(ArithmeticException)
        e.message == '/ by zero'
    }
}
```

## See Also

- [test-given-when-then](test-given-when-then.md) - Follow BDD given/when/then
- [test-data-tables](test-data-tables.md) - Use where blocks with data tables
- [test-mock-interactions](test-mock-interactions.md) - Use Mock/Stub/Spy
