# test-data-tables

> Use `where:` blocks with data tables for parameterized tests

## Why It Matters

Data tables in `where:` blocks run the same test logic against multiple inputs/outputs without loops or helper methods. Each row becomes a separate test case with its own failure report. This eliminates copy-pasted test code and makes edge cases visible in one place.

## Bad

```groovy
class CalculatorSpec extends Specification {
    def "addition works"() {
        expect:
        new Calculator().add(2, 3) == 5
    }
    // Need 10 more test methods to cover edge cases?
    def "addition with zero"() {
        expect:
        new Calculator().add(0, 5) == 5
    }
    def "addition with negatives"() {
        expect:
        new Calculator().add(-2, 3) == 1
    }
}
```

## Good

```groovy
class CalculatorSpec extends Specification {
    def "addition computes correct sum"() {
        expect:
        new Calculator().add(a, b) == result

        where:
        a  | b   || result
        2  | 3   || 5
        0  | 5   || 5
        -2 | 3   || 1
        -5 | -3  || -8
        0  | 0   || 0
        Integer.MAX_VALUE | 1 || Integer.MAX_VALUE + 1G
    }
}
```

## Multi-Variable Data Tables

```groovy
def "user validation checks all fields"() {
    expect:
    new UserValidator().validate(name, email, age) == expected

    where:
    name     | email            | age || expected
    'Alice'  | 'a@example.com'  | 30  || true
    ''       | 'a@example.com'  | 30  || false    // Empty name
    'Alice'  | ''               | 30  || false    // Empty email
    'Alice'  | 'a@example.com'  | -1  || false    // Negative age
    'Alice'  | 'invalid'        | 30  || false    // Bad email format
    null     | 'a@example.com'  | 30  || false    // Null name
}

// Data pipes (one-value-per-row)
def "text transforms"() {
    expect:
    text.toUpperCase() == expected

    where:
    text << ['hello', 'world', 'Groovy']
    expected << ['HELLO', 'WORLD', 'GROOVY']
}
```

## See Also

- [test-given-when-then](test-given-when-then.md) - Follow BDD given/when/then
- [test-spock-framework](test-spock-framework.md) - Use Spock for Groovy testing
- [name-test-method](name-test-method.md) - Test methods with descriptive labels
