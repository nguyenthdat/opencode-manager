# anti-null-propagation

> Don't return `null`; use `Optional` or empty collections

## Why It Matters

Returning `null` forces every caller to add null checks or risk `NullPointerException`. It's the most common source of production crashes in JVM applications. `Optional` makes absence explicit in the type system, and empty collections eliminate null checking entirely in iteration code.

## Bad

```groovy
class UserRepository {
    User findById(Long id) {
        def row = db.query('SELECT * FROM users WHERE id = ?', id)
        row.isEmpty() ? null : new User(row[0])    // Returns null!
    }

    List<Order> findOrders(Long userId) {
        def rows = db.query('SELECT * FROM orders WHERE user_id = ?', userId)
        rows.isEmpty() ? null : rows.collect { new Order(it) }  // Returns null!
    }
}

def user = repo.findById(123)
println user.name   // NPE if not found
```

## Good

```groovy
class UserRepository {
    Optional<User> findById(Long id) {
        def row = db.query('SELECT * FROM users WHERE id = ?', id)
        row.isEmpty() ? Optional.empty() : Optional.of(new User(row[0]))
    }

    List<Order> findOrders(Long userId) {
        def rows = db.query('SELECT * FROM orders WHERE user_id = ?', userId)
        rows.collect { new Order(it) }   // Always returns a list
    }
}

repo.findById(123).ifPresent { user -> println user.name }
def orders = repo.findOrders(123)
orders.each { process(it) }   // Safe — never null
```

## See Also

- [err-no-null-returns](err-no-null-returns.md) - Return Optional or empty collection
- [err-safe-navigation](err-safe-navigation.md) - Use ?. for null-safe traversal
- [err-elvis-default](err-elvis-default.md) - Use Elvis for default values
