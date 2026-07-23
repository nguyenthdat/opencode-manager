# meta-mixin-trait

> Use traits over runtime metaprogramming

## Why It Matters

Groovy traits provide compile-time mixin behavior with proper conflict resolution, state support, and static typing. Runtime metaprogramming (`@Mixin`, `ExpandoMetaClass`) is deprecated in favor of traits, which are faster, type-safe, and supported by IDEs.

## Bad

```groovy
class ValidationMixin {
    List errors = []
    void validate(String field, Closure check) {
        if (!check()) errors << "$field is invalid"
    }
}

// Deprecated @Mixin
@groovy.transform.Mixin(ValidationMixin)
class OrderService { }

// Or global metaClass
OrderService.metaClass.mixin(ValidationMixin)

// Runtime injection — no compile-time checking
def service = new OrderService()
service.validate('name') { false }
```

## Good

```groovy
trait Validatable {
    List<String> errors = []

    void validate(String field, Closure<Boolean> check) {
        if (!check()) errors << "$field is invalid"
    }

    boolean isValid() { errors.empty }

    void throwIfInvalid() {
        if (!isValid()) {
            throw new ValidationException(errors.join(', '))
        }
    }
}

class OrderService implements Validatable {
    def placeOrder(Order order) {
        validate('customer') { order.customer != null }
        validate('items') { !order.items.empty }
        throwIfInvalid()
        // ... process order
    }
}
```

## Trait Features

```groovy
trait Auditable {
    Date createdAt = new Date()
    Date updatedAt

    abstract String getAuditName()   // Abstract — must be implemented

    void touch() { updatedAt = new Date() }
}

trait Cached {
    private Map cache = [:]

    def cached(String key, Closure compute) {
        cache.computeIfAbsent(key) { compute() }
    }
}

class UserService implements Auditable, Cached {
    String getAuditName() { 'UserService' }

    def findUser(String id) {
        cached("user-$id") { db.query("SELECT * FROM users WHERE id = ?", id) }
    }
}
```

## See Also

- [meta-method-missing-cautious](meta-method-missing-cautious.md) - Use methodMissing sparingly
- [dsl-trait-injection](dsl-trait-injection.md) - Use traits for reusable DSL behavior
- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for performance
