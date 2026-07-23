# closure-no-return

> Avoid explicit `return` in simple closures (last expression is returned)

## Why It Matters

Groovy closures return the value of the last expression automatically. Explicit `return` is redundant in simple closures and can create confusion — it returns from the closure, not the enclosing method. Omitting `return` keeps closures concise and idiomatic.

## Bad

```groovy
def doubled = items.collect { item ->
    return item * 2
}

def active = users.findAll { user ->
    return user.active
}

def lookup = { key ->
    return cache.get(key)
}
```

## Good

```groovy
def doubled = items.collect { item ->
    item * 2   // Last expression is returned automatically
}

def active = users.findAll { user ->
    user.active
}

def lookup = { key ->
    cache.get(key)
}

// Or single-line for simple expressions
def doubled = items.collect { it * 2 }
def active = users.findAll { it.active }
```

## When `return` Is Necessary

```groovy
// Early return from a closure (guard clause)
def process = { item ->
    if (item.skip) return null   // Explicit early exit
    computeExpensive(item)       // Implicit return from last expression
}

// Returning from enclosing method inside closure
def findFirst(List items, threshold) {
    def result = null
    items.each { item ->
        if (item.value > threshold) {
            result = item
            // return here returns from CLOSURE, not findFirst!
        }
    }
    result
}

// Better: use .find{} which returns from the method naturally
def findFirst(List items, threshold) {
    items.find { it.value > threshold }
}
```

## See Also

- [closure-each-over-for](closure-each-over-for.md) - Prefer each over for loops
- [closure-compose-pipe](closure-compose-pipe.md) - Use << and >> for composition
- [anti-nested-closure-hell](anti-nested-closure-hell.md) - Don't nest closures beyond 3 levels
