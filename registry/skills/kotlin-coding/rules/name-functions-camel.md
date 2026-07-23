# name-functions-camel

> Use `camelCase` for functions and properties

## Why It Matters

camelCase for functions and properties is the single most load-bearing convention in Kotlin — mixing it with PascalCase or snake_case makes call sites ambiguous about whether an identifier is a type, a function, or a constant. Consistent camelCase also keeps interop with Java (which shares the convention) frictionless and keeps detekt/ktlint quiet.

## Bad

```kotlin
class OrderService {
    fun Calculate_Total(items: List<Item>): Double = items.sumOf { it.price }

    val Is_Ready: Boolean
        get() = true

    fun get_order(id: Long) = repository.find(id)
}
```

## Good

```kotlin
class OrderService {
    fun calculateTotal(items: List<Item>): Double = items.sumOf { it.price }

    val isReady: Boolean
        get() = true

    fun getOrder(id: Long) = repository.find(id)
}
```

## Backing Fields and Local Variables

```kotlin
class Cache {
    private var lastAccessTime: Long = 0L

    fun touch() {
        lastAccessTime = System.currentTimeMillis()
    }
}

fun main() {
    val totalItemCount = 42 // local vals/vars are camelCase too
}
```

## Ktlint/Detekt Rule

`detekt`'s `naming.FunctionNaming` and `naming.VariableNaming` rules enforce `[a-z][a-zA-Z0-9]*` by default; ktlint's `standard:function-naming` mirrors this.

```yaml
naming:
  FunctionNaming:
    functionPattern: '[a-z][a-zA-Z0-9]*'
  VariableNaming:
    variablePattern: '[a-z][a-zA-Z0-9]*'
```

## See Also

- [`name-classes-pascal`](name-classes-pascal.md) - casing rule for types
- [`name-boolean-is-has`](name-boolean-is-has.md) - specific prefix convention for boolean members
- [`name-receiver-param-this`](name-receiver-param-this.md) - naming inside lambda receivers
