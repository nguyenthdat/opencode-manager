# perf-compile-static

> Use `@CompileStatic` for production code

## Why It Matters

`@CompileStatic` compiles Groovy to bytecode nearly identical to Java's, providing 3-10x performance improvement over dynamic Groovy. It also catches type errors at compile time that would otherwise become runtime failures. All production Groovy should use `@CompileStatic` unless dynamic features are essential.

## Bad

```groovy
class Calculator {
    def add(a, b) { a + b }          // Dynamic dispatch — slow
    def multiply(a, b) { a * b }
}

def calc = new Calculator()
(1..100_000).each {
    calc.add(it, it * 2)              // 6-10x slower than Java
}
```

## Good

```groovy
@groovy.transform.CompileStatic
class Calculator {
    int add(int a, int b) { a + b }
    int multiply(int a, int b) { a * b }
}

def calc = new Calculator()
(1..100_000).each {
    calc.add(it, it * 2)              // Near-Java performance
}

// Apply at script level
@groovy.transform.CompileStatic
def processOrders(List<Order> orders) {
    orders.findAll { o -> o.total > 100 }
        .collect { o -> o.id }
}
```

## Granular Application

```groovy
// Class-level
@groovy.transform.CompileStatic
class OrderService { /* ... */ }

// Method-level — only specific methods are static-compiled
class MixedService {
    @groovy.transform.CompileStatic
    List<String> processFast(List<String> items) {
        items.collect { it.toUpperCase() }
    }

    // Dynamic method — uses methodMissing for DSL
    def dynamicProcess(Closure config) {
        // OK to leave dynamic if needed
    }
}

// Configure globally via compiler
withConfig(configuration) {
    ast(groovy.transform.CompileStatic)
}
```

## See Also

- [perf-type-check-annotation](perf-type-check-annotation.md) - Use @TypeChecked for early detection
- [perf-no-runtime-meta](perf-no-runtime-meta.md) - Avoid runtime metaprogramming in hot paths
- [anti-no-compile-static](anti-no-compile-static.md) - Don't skip CompileStatic for production
