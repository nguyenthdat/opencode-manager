# meta-delegating-metaClass

> Prefer `@Delegate` over manual delegation

## Why It Matters

Manual delegation (writing wrapper methods that forward to another object) is boilerplate-heavy and falls out of sync when the delegate's interface changes. `@Delegate` auto-generates all delegation methods at compile time, keeping the wrapper in sync automatically.

## Bad

```groovy
class UserRepository {
    List<User> findAll() { /* ... */ }
    User findById(Long id) { /* ... */ }
    void save(User user) { /* ... */ }
    void delete(Long id) { /* ... */ }
    long count() { /* ... */ }
}

class CachedUserRepository {
    private UserRepository delegate  // 5 methods to manually delegate!

    List<User> findAll() { delegate.findAll() }
    User findById(Long id) { delegate.findById(id) }
    void save(User user) { delegate.save(user) }
    void delete(Long id) { delegate.delete(id) }
    long count() { delegate.count() }
    // Add a method to UserRepository? Must update this class too!
}
```

## Good

```groovy
class UserRepository {
    List<User> findAll() { /* ... */ }
    User findById(Long id) { /* ... */ }
    void save(User user) { /* ... */ }
    void delete(Long id) { /* ... */ }
    long count() { /* ... */ }
}

class CachedUserRepository {
    @Delegate
    UserRepository delegate    // All methods auto-delegated!

    // Override only what you need to change
    User findById(Long id) {
        cache.get(id) ?: delegate.findById(id).tap { cache.put(id, it) }
    }
}
```

## @Delegate Options

```groovy
// Exclude certain methods from delegation
class ReadOnlyRepository {
    @Delegate(excludes = [save, delete])
    UserRepository delegate
}

// Delegate only specific methods
class CountingRepository {
    @Delegate(includes = [findAll, findById, count])
    UserRepository delegate
}

// Delegate to a specific type
class MultiDelegate {
    @Delegate(interfaces = false)    // Only delegate declared methods
    UserRepository users

    @Delegate
    OrderRepository orders
}
```

## See Also

- [meta-mixin-trait](meta-mixin-trait.md) - Use traits over runtime metaprogramming
- [col-immutable-collections](col-immutable-collections.md) - Use @Immutable or asImmutable
- [meta-method-missing-cautious](meta-method-missing-cautious.md) - Use methodMissing sparingly
