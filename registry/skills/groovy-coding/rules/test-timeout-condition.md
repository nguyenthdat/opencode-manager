# test-timeout-condition

> Use timeout conditions with appropriate wait

## Why It Matters

Asynchronous tests that use `Thread.sleep()` are flaky — too short a sleep causes false failures, too long wastes CI time. Spock's `PollingConditions` and blocking variables provide deterministic waiting for asynchronous results, making tests both fast and reliable.

## Bad

```groovy
def "async message is received"() {
    given:
    def queue = new MessageQueue()
    def received = []

    when:
    queue.subscribe { msg -> received << msg }
    queue.publish('Hello')

    then:
    Thread.sleep(500)          // Fragile! Might still fail on slow CI
    received == ['Hello']
}
```

## Good

```groovy
def "async message is received"() {
    given:
    def queue = new MessageQueue()
    def received = []
    def conditions = new PollingConditions(timeout: 5, delay: 0.1)

    when:
    queue.subscribe { msg -> received << msg }
    queue.publish('Hello')

    then:
    conditions.eventually {
        received == ['Hello']
    }
}

// Using blocking variables
def "future completes with result"() {
    given:
    def promise = new CompletableFuture<String>()

    when:
    Thread.start { sleep(100); promise.complete('Done') }

    then:
    promise.get(5, TimeUnit.SECONDS) == 'Done'
}
```

## See Also

- [test-given-when-then](test-given-when-then.md) - Follow BDD given/when/then
- [test-spock-framework](test-spock-framework.md) - Use Spock for Groovy testing
- [test-mock-interactions](test-mock-interactions.md) - Use Mock/Stub/Spy
