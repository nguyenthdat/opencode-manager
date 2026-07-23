# perf-no-runtime-meta

> Avoid runtime metaprogramming in hot paths

## Why It Matters

Runtime metaprogramming (methodMissing, ExpandoMetaClass, propertyMissing) uses reflection and dynamic dispatch, which is orders of magnitude slower than direct method calls. In loops or frequently-called methods, the overhead dominates execution time. Move dynamic behavior to initialization or use compile-time alternatives.

## Bad

```groovy
def processBatch(List<Map> records) {
    records.each { record ->
        // Dynamically resolve fields every iteration
        def obj = new Expando()
        record.each { k, v -> obj."$k" = v }     // Dynamic property setting

        def transformed = record.collectEntries { k, v ->
            [(k): obj."$k".toString().toUpperCase()]  // Dynamic get + reflection
        }
    }
}

@groovy.transform.CompileStatic
class Service {
    def handle(String method, args) {
        this."$method"(*args)    // Reflection inside a hot method
    }
}
```

## Good

```groovy
@groovy.transform.CompileStatic
class RecordProcessor {
    static Record transform(Map data) {
        new Record(
            id: data.id as Long,
            name: data.name as String,
            value: data.value as Double
        )
    }
}

def processBatch(List<Map> records) {
    records.each { record ->
        def obj = RecordProcessor.transform(record)   // Compile-time resolved
        // Further processing with typed method calls
    }
}
```

## See Also

- [meta-compile-static-check](meta-compile-static-check.md) - Use CompileStatic with metaprogramming
- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for production
- [anti-runtime-meta-hot](anti-runtime-meta-hot.md) - Don't use metaprogramming in hot paths
