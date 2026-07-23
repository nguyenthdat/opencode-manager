# anti-runtime-meta-hot

> Don't use runtime metaprogramming in hot paths

## Why It Matters

Runtime metaprogramming relies on reflection and dynamic dispatch, which are orders of magnitude slower than direct method calls. In frequently executed code (loops, request handlers), the overhead adds up quickly. Move dynamic behavior to initialization or use compile-time alternatives.

## Bad

```groovy
def processOrders(List<Map> orders) {
    orders.each { order ->
        def obj = new Expando()
        order.each { k, v -> obj."$k" = v }  // Dynamic property setting in loop
        obj.total = obj.price * obj.quantity   // Dynamic dispatch for every field
        obj.save()
    }
}

// MethodMissing in a hot method
class Proxy {
    def methodMissing(String name, args) {
        delegate."$name"(*args)   // Reflection on every call
    }
}
```

## Good

```groovy
@groovy.transform.CompileStatic
class OrderProcessor {
    static OrderRecord transform(Map data) {
        new OrderRecord(
            price: data.price as BigDecimal,
            quantity: data.quantity as int,
            total: (data.price as BigDecimal) * (data.quantity as int)
        )
    }

    static void processOrders(List<Map> orders) {
        orders.each { order ->
            def record = transform(order)   // Compile-time resolved
            record.save()
        }
    }
}
```

## See Also

- [perf-no-runtime-meta](perf-no-runtime-meta.md) - Avoid runtime metaprogramming in hot paths
- [meta-compile-static-check](meta-compile-static-check.md) - Use CompileStatic with metaprogramming
- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for production
