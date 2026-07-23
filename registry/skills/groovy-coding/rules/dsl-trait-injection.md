# dsl-trait-injection

> Use traits for reusable DSL behavior

## Why It Matters

Traits provide compile-time-safe mixin behavior for DSL builders. Unlike runtime metaprogramming (`@Mixin`, `ExpandoMetaClass`), traits are statically verifiable, support method resolution conflicts via explicit disambiguation, and work with `@CompileStatic`.

## Bad

```groovy
// Runtime mixin — no compile-time checking
class OrderBuilder {
    // methods added at runtime
}

OrderBuilder.metaClass.mixin(ValidationSupport)
OrderBuilder.metaClass.mixin(LoggingSupport)

// Or using @Mixin (deprecated)
@groovy.transform.Mixin(ValidationSupport)
class OrderBuilder { /* ... */ }
```

## Good

```groovy
trait ValidationSupport {
    List<String> errors = []

    void validate(Closure condition, String message) {
        if (!condition()) errors << message
    }

    boolean isValid() { errors.empty }

    void throwIfInvalid() {
        if (!isValid()) throw new ValidationException(errors)
    }
}

trait AuditingSupport {
    List<String> auditLog = []

    void audit(String action) {
        auditLog << "[${new Date()}] $action"
    }
}

class OrderBuilder implements ValidationSupport, AuditingSupport {
    String customer
    List items = []

    def build() {
        validate { customer != null },
            'Customer is required'
        validate { !items.empty },
            'Order must have items'
        throwIfInvalid()
        audit("Order built for $customer")
        new Order(customer: customer, items: items)
    }
}
```

## See Also

- [meta-mixin-trait](meta-mixin-trait.md) - Use traits over runtime metaprogramming
- [dsl-closure-delegate](dsl-closure-delegate.md) - Set proper delegate in builder closures
- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for performance
