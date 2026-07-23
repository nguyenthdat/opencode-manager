# closure-compose-pipe

> Use `<<` and `>>` for closure composition

## Why It Matters

Closure composition with `>>` (forward) and `<<` (backward) operators creates reusable pipelines from simple building blocks. Instead of deeply nesting closures or writing intermediate variables, you combine pure functions declaratively. This enables point-free style and makes data flow explicit.

## Bad

```groovy
def trim = { it.trim() }
def uppercase = { it.toUpperCase() }
def addPrefix = { "[$it]" }

// Nested manual composition
def process = { input ->
    addPrefix(uppercase(trim(input)))
}

assert process(' hello ') == '[HELLO]'

// Multiple transformations chained manually
def result = items
    .collect { it.trim() }
    .collect { it.toUpperCase() }
    .collect { "[$it]" }
```

## Good

```groovy
def trim = { it.trim() }
def uppercase = { it.toUpperCase() }
def addPrefix = { "[$it]" }

// Forward composition (left to right): trim → uppercase → addPrefix
def process = trim >> uppercase >> addPrefix

assert process(' hello ') == '[HELLO]'

// Backward composition (right to left): same result
def process2 = addPrefix << uppercase << trim

assert process2(' hello ') == '[HELLO]'

// Apply to collections
def result = items.collect(process)
```

## Practical Pipelines

```groovy
def normalize = { String s -> s.strip().toLowerCase() }
def excludeStopWords = { String s ->
    s.tokenize().findAll { !(it in ['the', 'a', 'an']) }.join(' ')
}
def truncate = { String s -> s.size() > 100 ? s[0..99] : s }

def cleanText = normalize >> excludeStopWords >> truncate

def cleaned = documents.collect(cleanText)

// Conditional composition
def withFallback = { s -> s ?: 'N/A' }
def safeProcessor = cleanText >> withFallback
```

## See Also

- [closure-curry-composition](closure-curry-composition.md) - Use curry for partial application
- [closure-no-side-effects](closure-no-side-effects.md) - Keep closures side-effect-free
- [col-collect-over-map](col-collect-over-map.md) - Use collect over manual loops
