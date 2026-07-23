# anti-no-compile-static

> Don't skip `@CompileStatic` for production code

## Why It Matters

Dynamic Groovy runs 3-10x slower than statically compiled Groovy. Every method call involves runtime dispatch, type coercion, and metadata lookups. In production, this translates to higher CPU usage, longer response times, and increased cloud costs. Always use `@CompileStatic` unless dynamic features are demonstrably necessary.

## Bad

```groovy
// Entire codebase is dynamic — slow and error-prone
class UserService {
    def findUser(id) {
        db.query("SELECT * FROM users WHERE id = $id")[0]
    }

    def processUsers(users) {
        users.collect { it.name.toUpperCase() }  // Every call is dynamic
    }
}
```

## Good

```groovy
@groovy.transform.CompileStatic
class UserService {
    Map<String, Object> findUser(Long id) {
        db.query("SELECT * FROM users WHERE id = $id")[0] as Map
    }

    List<String> processUsers(List<User> users) {
        users.collect { user -> user.name.toUpperCase() }
    }
}

// If you truly need dynamic behavior, isolate it
class DynamicBuilder {
    // NO @CompileStatic on this class — uses methodMissing for DSL
    def methodMissing(String name, args) { /* ... */ }
}
```

## See Also

- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for production
- [perf-type-check-annotation](perf-type-check-annotation.md) - Use @TypeChecked for early detection
- [perf-no-runtime-meta](perf-no-runtime-meta.md) - Avoid runtime metaprogramming in hot paths
