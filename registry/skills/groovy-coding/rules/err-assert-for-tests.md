# err-assert-for-tests

> Use `assert` for tests, not production code

## Why It Matters

Groovy's `assert` is a powerful testing tool with detailed power-assert output, but assertions can be disabled with JVM flags (`-da`). Using `assert` in production code creates unreliable error handling that may silently disappear. Reserve assertions for Spock tests and test scripts.

## Bad

```groovy
class PaymentService {
    def process(Payment payment) {
        assert payment.amount > 0          // May be disabled in production!
        assert payment.currency != null    // Silent failure if assertions off
        charge(payment)
    }
}

def loadConfig() {
    def config = new ConfigSlurper().parse(new File('config.groovy').toURL())
    assert config.server != null           // Production should never use assert
    assert config.server.port > 0
    return config
}
```

## Good

```groovy
class PaymentService {
    def process(Payment payment) {
        if (payment.amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive, got ${payment.amount}")
        }
        if (payment.currency == null) {
            throw new IllegalArgumentException("Currency is required")
        }
        charge(payment)
    }
}

def loadConfig() {
    def config = new ConfigSlurper().parse(new File('config.groovy').toURL())
    if (config.server == null) {
        throw new IllegalStateException("Config missing 'server' section")
    }
    if (config.server.port <= 0) {
        throw new IllegalStateException("Server port must be positive: ${config.server.port}")
    }
    return config
}

// assert is perfect in Spock tests
class PaymentServiceSpec extends spock.lang.Specification {
    def "process throws for zero amount"() {
        given:
        def service = new PaymentService()

        when:
        service.process(new Payment(amount: 0))

        then:
        thrown(IllegalArgumentException)
    }
}
```

## See Also

- [test-spock-framework](test-spock-framework.md) - Use Spock for Groovy testing
- [err-custom-exception](err-custom-exception.md) - Create domain-specific exceptions
- [err-no-null-returns](err-no-null-returns.md) - Return Optional, not null
