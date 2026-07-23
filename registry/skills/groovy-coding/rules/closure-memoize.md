# closure-memoize

> Use `.memoize()` for expensive closure results

## Why It Matters

Repeated calls to expensive or pure computations waste CPU cycles. Groovy closures support built-in memoization that caches return values keyed by arguments, transforming repeated calls into O(1) lookups. This is especially valuable for recursive or computation-heavy closures.

## Bad

```groovy
def fibonacci = { n ->
    n < 2 ? n : call(n - 1) + call(n - 2)
}

(0..40).each {
    println fibonacci(it)  // Exponential time — extremely slow
}

def expensiveConfig = { String env ->
    // Reads file, parses YAML every time
    def config = new ConfigSlurper().parse(new File("config-${env}.groovy").toURL())
    config.flatten()
}

3.times {
    def cfg = expensiveConfig('production')  // Parses file 3 times
}
```

## Good

```groovy
def fibonacci = { n ->
    n < 2 ? n : call(n - 1) + call(n - 2)
}.memoize()

(0..40).each {
    println fibonacci(it)  // O(n) time — cached results
}

def expensiveConfig = { String env ->
    def config = new ConfigSlurper().parse(new File("config-${env}.groovy").toURL())
    config.flatten()
}.memoize()

3.times {
    def cfg = expensiveConfig('production')  // Parses file only once
}
```

## Memoization Variants

```groovy
// memoize() — unlimited cache
def cached = op.memoize()

// memoizeAtMost(N) — LRU cache with max size
def cached = op.memoizeAtMost(100)

// memoizeAtLeast(N) — cache with protected recent entries
def cached = op.memoizeAtLeast(10)

// memoizeBetween(min, max) — combined protection
def cached = op.memoizeBetween(10, 100)
```

## See Also

- [closure-curry-composition](closure-curry-composition.md) - Use curry for partial application
- [closure-trampoline](closure-trampoline.md) - Use trampoline for tail recursion
- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for performance
