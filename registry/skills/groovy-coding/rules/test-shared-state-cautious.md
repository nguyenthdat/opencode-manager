# test-shared-state-cautious

> Use `@Shared` sparingly; prefer fresh instances

## Why It Matters

`@Shared` fields persist across all feature methods in a specification, violating test isolation. Shared mutable state causes test ordering dependencies, flaky tests, and hard-to-debug failures where one test's side effects break another. Fresh instances per test are safer and cleaner.

## Bad

```groovy
class UserRepoSpec extends Specification {
    @Shared
    Database db = Database.connect('jdbc:h2:mem:test')

    @Shared
    UserRepository repo = new UserRepository(db)

    @Shared
    User testUser                     // Modified across tests!

    def setup() {
        testUser = repo.create('Alice', 'alice@example.com')
    }

    def "updates user email"() {
        when:
        repo.updateEmail(testUser.id, 'new@example.com')
        // Side effect! This changes testUser for subsequent tests!

        then:
        repo.findById(testUser.id).email == 'new@example.com'
    }

    def "finds user by email"() {
        expect:
        repo.findByEmail('alice@example.com') != null
        // PASSES or FAILS depending on whether previous test ran first!
    }
}
```

## Good

```groovy
class UserRepoSpec extends Specification {
    Database db
    UserRepository repo

    def setup() {
        db = Database.connect('jdbc:h2:mem:test')
        repo = new UserRepository(db)
    }

    def cleanup() {
        db?.close()
    }

    def "updates user email"() {
        given:
        def user = repo.create('Alice', 'alice@example.com')

        when:
        repo.updateEmail(user.id, 'new@example.com')

        then:
        repo.findById(user.id).email == 'new@example.com'
    }

    def "finds user by email"() {
        given:
        repo.create('Alice', 'alice@example.com')

        expect:
        repo.findByEmail('alice@example.com') != null
    }
}
```

## When @Shared IS Appropriate

```groovy
class HeavyResourceSpec extends Specification {
    @Shared
    DatabaseConnectionPool pool    // Expensive to create, immutable after creation

    def setupSpec() {
        pool = DatabaseConnectionPool.create()   // Created once, read-only in tests
    }

    // Tests use pool but never mutate it
}
```

## See Also

- [test-fixture-methods](test-fixture-methods.md) - Use setup/cleanup fixture methods
- [test-spock-framework](test-spock-framework.md) - Use Spock for Groovy testing
- [test-clean-blocks](test-clean-blocks.md) - Keep when blocks single-action
