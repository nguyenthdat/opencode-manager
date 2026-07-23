# closure-type-check

> Use `@ClosureParams` for IDE support

## Why It Matters

Without type hints, IDE autocompletion, refactoring, and static analysis cannot understand closure parameter types. `@ClosureParams` and `@DelegatesTo` annotations inform the type checker about closure signatures, enabling compile-time safety and IDE features even in dynamic Groovy.

## Bad

```groovy
class CollectionUtils {
    // No type info — IDE can't help
    static def process(List items, Closure transformer) {
        items.collect(transformer)
    }
}

// IDE has no idea what 'it' is
def result = CollectionUtils.process(users) {
    it.name  // No autocompletion, no type checking
}
```

## Good

```groovy
import groovy.transform.stc.ClosureParams
import groovy.transform.stc.SimpleType
import groovy.transform.stc.FirstParam

class CollectionUtils {
    @groovy.transform.TypeChecked
    static <T, R> List<R> process(
        List<T> items,
        @ClosureParams(FirstParam) Closure<R> transformer
    ) {
        items.collect(transformer)
    }
}

// IDE now knows 'it' is a User
def result = CollectionUtils.process(users) { user ->
    user.name  // Autocompletion works, type-checked
}
```

## Common @ClosureParams Hints

```groovy
// SimpleType — closure takes a specific type
void eachFile(File dir, @ClosureParams(value = SimpleType, options = ['java.io.File']) Closure c)

// FirstParam — closure param matches first method arg type
<T> List<T> filter(List<T> list, @ClosureParams(FirstParam) Closure<Boolean> predicate)

// SecondParam — closure param matches second method arg type
void process(Config cfg, List<Item> items, @ClosureParams(SecondParam) Closure c)

// FromString — explicit type string
void parse(@ClosureParams(value = FromString, options = ['java.lang.String', 'java.lang.Integer']) Closure c)

// @DelegatesTo — for DSL closures
void build(@DelegatesTo(Builder) @ClosureParams(value = SimpleType, options = ['Builder']) Closure c)
```

## See Also

- [closure-delegate-strategy](closure-delegate-strategy.md) - Set delegate strategy for DSL closures
- [dsl-closure-delegate](dsl-closure-delegate.md) - Set proper delegate in builder closures
- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for performance
