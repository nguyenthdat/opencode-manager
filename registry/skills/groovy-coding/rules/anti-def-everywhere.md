# anti-def-everywhere

> Don't overuse `def`; prefer explicit types for public APIs

## Why It Matters

While `def` is idiomatic for local variables, using it for public method signatures, return types, and fields hides the API contract. Consumers of your code can't tell what types to expect without reading the implementation, and IDEs can't provide accurate autocompletion.

## Bad

```groovy
class OrderService {
    def repository                        // What type?
    def notifier                          // What type?

    def placeOrder(def order) {          // What does it accept? What does it return?
        def result = validate(order)      // What type is result?
        if (result) {
            return repository.save(order)
        }
        return null                       // Return type is unpredictable
    }

    def validate(def order) {           // Public method with no type info
        order.items != null
    }
}
```

## Good

```groovy
@groovy.transform.CompileStatic
class OrderService {
    OrderRepository repository
    NotificationService notifier

    OrderReceipt placeOrder(Order order) {
        if (!validate(order)) {
            throw new ValidationException('Invalid order')
        }
        return repository.save(order)
    }

    boolean validate(Order order) {
        order.items != null && !order.items.empty
    }
}
```

## When `def` IS Appropriate

```groovy
// Local variables where type is obvious
def name = 'Alice'
def count = items.size()
def filtered = users.findAll { it.active }

// Closures
def doubler = { int x -> x * 2 }

// Loop variables in .each{}
items.each { item -> }   // 'item' type is inferred from context
```

## See Also

- [name-def-over-type](name-def-over-type.md) - Prefer def for local variables
- [name-methods-camelCase](name-methods-camelCase.md) - Use camelCase for methods
- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for production
