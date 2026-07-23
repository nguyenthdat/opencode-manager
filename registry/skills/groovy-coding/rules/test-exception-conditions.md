# test-exception-conditions

> Use `thrown()` for expected exceptions

## Why It Matters

`thrown()` in the `then:` block is Spock's idiomatic way to assert that an exception is thrown. It returns the exception for further assertions and fails the test if the exception isn't thrown. Manual try-catch with fail() is verbose and error-prone.

## Bad

```groovy
def "invalid input throws exception"() {
    given:
    def parser = new Parser()

    when:
    parser.parse('invalid')

    then:
    try {
        parser.parse('invalid')
        assert false : 'Expected exception'
    } catch (ParseException e) {
        assert e.message == 'Unexpected token at line 1'
    }
}
```

## Good

```groovy
def "invalid input throws exception"() {
    given:
    def parser = new Parser()

    when:
    parser.parse('invalid')

    then:
    def e = thrown(ParseException)
    e.message == 'Unexpected token at line 1'
}

// No exception expected
def "valid input does not throw"() {
    given:
    def parser = new Parser()

    when:
    parser.parse('valid input')

    then:
    notThrown(Exception)
}

// Specific exception with cause
def "network error wraps IOException"() {
    when:
    service.fetchData()

    then:
    def e = thrown(ServiceException)
    e.cause instanceof IOException
}
```

## See Also

- [test-given-when-then](test-given-when-then.md) - Follow BDD given/when/then
- [test-mock-interactions](test-mock-interactions.md) - Use Mock/Stub/Spy
- [test-clean-blocks](test-clean-blocks.md) - Keep when blocks single-action
