# closure-implicit-it

> Use implicit `it` sparingly in closures

## Why It Matters

Implicit `it` is convenient for single-parameter closures but becomes ambiguous in nested closures and harms readability in non-trivial expressions. Named parameters make the intent clear and prevent confusion when closures are composed.

## Bad

```groovy
def users = ['Alice', 'Bob', 'Charlie']

users.each {
    println it.toUpperCase()
}

orders.findAll {
    it.total > 100
}.each {
    processOrder(it)
}

items.collect {
    it.price * it.quantity
}.findAll {
    it > 50
}.each {
    logHighValue it
}
```

## Good

```groovy
def users = ['Alice', 'Bob', 'Charlie']

users.each { name ->
    println name.toUpperCase()
}

orders.findAll { order ->
    order.total > 100
}.each { order ->
    processOrder(order)
}

items.collect { item ->
    item.price * item.quantity
}.findAll { total ->
    total > 50
}.each { total ->
    logHighValue(total)
}
```

## When `it` Is Acceptable

```groovy
// Single trivial expression with no nesting
names.findAll { it.startsWith('A') }

// Single method reference
numbers.each { println it }

// Collecting with a single property
users.collect { it.name }
```

## See Also

- [name-closure-params](name-closure-params.md) - Name closure parameters meaningfully
- [closure-each-over-for](closure-each-over-for.md) - Prefer `.each{}` over `for` loops
- [anti-nested-closure-hell](anti-nested-closure-hell.md) - Don't nest closures beyond 3 levels
