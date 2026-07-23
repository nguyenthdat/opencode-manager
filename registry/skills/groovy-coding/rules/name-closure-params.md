# name-closure-params

> Name closure parameters meaningfully, not `it`

## Why It Matters

Closure parameters should be named after what they represent, not the generic `it`. Meaningful names improve readability, make code searchable, and prevent ambiguity in nested closures. Reserve `it` only for the simplest single-parameter closures where the meaning is obvious from context.

## Bad

```groovy
users.each { println it }           // Acceptable for one-liners
users.collect { it.name }           // Fine for property access

orders.findAll { it.total > 100 }   // What is 'it'? An order? Ambiguous in context
    .each { it.id }                 // Still 'it' — what does it refer to now?
    .collect { [it, it*2] }         // Completely unclear

def process = { it * 2 }            // What does process double?
```

## Good

```groovy
users.each { user -> println user }

orders.findAll { order -> order.total > 100 }
    .collect { order -> order.id }

def double = { number -> number * 2 }

// Multi-parameter closures need explicit names
map.each { key, value ->
    println "$key -> $value"
}

// For simple property extraction, collect shorthand exists
def names = users*.name
```

## See Also

- [closure-implicit-it](closure-implicit-it.md) - Use implicit it sparingly
- [closure-each-over-for](closure-each-over-for.md) - Prefer each over for loops
- [anti-nested-closure-hell](anti-nested-closure-hell.md) - Don't nest closures beyond 3 levels
