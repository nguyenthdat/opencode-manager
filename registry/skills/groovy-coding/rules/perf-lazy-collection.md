# perf-lazy-collection

> Use lazy sequences for large intermediate results

## Why It Matters

Chaining `.collect{}`, `.findAll{}`, and other GDK methods creates intermediate collections at each step. For large datasets, this wastes memory and time. Groovy 4's lazy methods or Java streams evaluate the entire pipeline in one pass without intermediate allocations.

## Bad

```groovy
def results = (1..1_000_000)
    .collect { it * 2 }                    // 1M-element list allocated
    .findAll { it % 3 == 0 }               // Another large list
    .collect { "Value: $it" }              // Yet another
    .take(100)

// Three 1M-element lists created, only 100 items kept!
```

## Good

```groovy
// Java streams — single pass, only 100 items materialized
def results = (1..1_000_000).stream()
    .map { it * 2 }
    .filter { it % 3 == 0 }
    .map { "Value: $it" }
    .limit(100)
    .toList()

// Groovy 4 lazy methods
def results = (1..1_000_000)
    .lazy
    .collect { it * 2 }
    .findAll { it % 3 == 0 }
    .collect { "Value: $it" }
    .take(100)
    .toList()

// Or: break early with .find()/.findAll() which short-circuit
def first = (1..1_000_000).find {
    def doubled = it * 2
    doubled % 3 == 0 && doubled > 1000
}
```

## See Also

- [col-collect-over-map](col-collect-over-map.md) - Use collect for transformations
- [col-find-results](col-find-results.md) - Use findAll for filtering
- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for production
