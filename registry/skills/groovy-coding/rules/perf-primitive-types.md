# perf-primitive-types

> Use primitive types (`int`, `long`) over boxed `Integer` / `Long`

## Why It Matters

Boxed types (`Integer`, `Long`, `Boolean`) incur allocation overhead, memory indirection, and null-checking costs. Primitives (`int`, `long`, `boolean`) are stack-allocated and directly operated on by the CPU. Under `@CompileStatic`, Groovy uses JVM primitives for maximum performance.

## Bad

```groovy
@groovy.transform.CompileStatic
class Metrics {
    Integer count = 0               // Boxed — heap allocation
    Long totalDuration = 0L         // Boxed
    Double average = 0.0d           // Boxed
    Boolean enabled = true          // Boxed

    void record(Integer duration) {
        count = count + 1           // Unbox, add, re-box on every operation
        totalDuration = totalDuration + duration
    }
}
```

## Good

```groovy
@groovy.transform.CompileStatic
class Metrics {
    int count = 0                   // Primitive — stack-allocated
    long totalDuration = 0L         // Primitive
    double average = 0.0d           // Primitive
    boolean enabled = true          // Primitive

    void record(int duration) {     // No boxing overhead
        count++
        totalDuration += duration
    }
}
```

## When Boxed Types Are Needed

```groovy
// Nullable values — use boxed types when null is meaningful
@groovy.transform.CompileStatic
class Employee {
    Integer managerId      // null = no manager
    Long bonusAmount       // null = no bonus calculated

    boolean isBonusPending() {
        bonusAmount == null
    }
}

// Generics require boxed types
List<Integer> scores = [95, 87, 92]
```

## See Also

- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for production
- [perf-coll-init-capacity](perf-coll-init-capacity.md) - Initialize collections with known capacity
- [name-def-over-type](name-def-over-type.md) - Prefer def for local variables
