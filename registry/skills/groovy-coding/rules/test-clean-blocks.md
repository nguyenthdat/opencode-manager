# test-clean-blocks

> Keep `when:` blocks single-action

## Why It Matters

The `when:` block should contain exactly the action being tested. Multiple actions in `when:` obscure which action caused a failure and violate the "one behavior per test" principle. If you need to test multiple operations, use separate feature methods or `where:` blocks.

## Bad

```groovy
def "user service operations"() {
    given:
    def service = new UserService()

    when: "perform multiple operations"
    def user = service.create('Alice', 'alice@example.com')
    service.updateEmail(user.id, 'new@example.com')
    service.deactivate(user.id)
    def found = service.findById(user.id)

    then:
    user.name == 'Alice'
    found.email == 'new@example.com'
    !found.active
}
```

## Good

```groovy
def "creating a user stores the correct name"() {
    given:
    def service = new UserService()

    when:
    def user = service.create('Alice', 'alice@example.com')

    then:
    user.name == 'Alice'
    user.email == 'alice@example.com'
}

def "updating email changes the stored value"() {
    given:
    def service = new UserService()
    def user = service.create('Alice', 'alice@example.com')

    when:
    service.updateEmail(user.id, 'new@example.com')

    then:
    service.findById(user.id).email == 'new@example.com'
}

def "deactivating a user sets active to false"() {
    given:
    def service = new UserService()
    def user = service.create('Alice', 'alice@example.com')

    when:
    service.deactivate(user.id)

    then:
    !service.findById(user.id).active
}
```

## See Also

- [test-given-when-then](test-given-when-then.md) - Follow BDD given/when/then
- [test-data-tables](test-data-tables.md) - Use where blocks with data tables
- [test-spock-framework](test-spock-framework.md) - Use Spock for Groovy testing
