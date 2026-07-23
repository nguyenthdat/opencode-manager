# col-grep-filter

> Use `.grep()` for type/pattern filtering

## Why It Matters

`.grep()` is Groovy's concise filter that accepts a type (filter by class), a pattern (filter by regex match), or a closure (filter by predicate). It's more readable than explicit `instanceof` checks or `matches()` calls in loops and composes naturally with other collection methods.

## Bad

```groovy
def strings = []
mixedList.each { item ->
    if (item instanceof String) {
        strings << item
    }
}

def matches = []
lines.each { line ->
    if (line ==~ /ERROR.*/) {
        matches << line
    }
}

def numbersOnly = items.findAll { it instanceof Number }
```

## Good

```groovy
// Filter by type
def strings = mixedList.grep(String)

// Filter by regex pattern
def errors = lines.grep(~/ERROR.*/)

// Filter by class
def numbersOnly = items.grep(Number)

// Filter by list of types
def specials = items.grep([String, Integer])

// grep with closure (like findAll)
def longStrings = items.grep { it.length() > 10 }
```

## grep vs findAll

```groovy
// grep(Object) — uses isCase() for matching, which supports:
//   - Class: instance check
//   - Pattern: regex matching
//   - Collection: contains check
//   - Range: within check
//   - Closure: predicate

def numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

assert numbers.grep(1..5) == [1, 2, 3, 4, 5]       // Range match
assert numbers.grep([2, 4, 6, 8]) == [2, 4, 6, 8]   // Collection match
assert numbers.grep({ it % 2 == 0 }) == [2, 4, 6, 8, 10]  // Predicate

// For simple predicates, findAll is more explicit
assert numbers.findAll { it % 2 == 0 } == [2, 4, 6, 8, 10]
```

## See Also

- [col-find-results](col-find-results.md) - Use findAll for filtering
- [col-collect-over-map](col-collect-over-map.md) - Use collect for transformations
- [col-any-every](col-any-every.md) - Use any/every for boolean checks
