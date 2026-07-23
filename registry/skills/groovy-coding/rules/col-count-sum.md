# col-count-sum

> Use `.count{}` and `.sum{}` over manual counters

## Why It Matters

`.count{}` and `.sum{}` directly express counting and summing operations over collections. They eliminate temporary counter variables, loop boilerplate, and the risk of forgetting to initialize or update accumulators. The closure variants allow counting/summing derived values.

## Bad

```groovy
def errorCount = 0
for (entry in logEntries) {
    if (entry.level == 'ERROR') {
        errorCount++
    }
}

def total = 0
for (item in cart) {
    total += item.price * item.quantity
}

def charCount = 0
words.each { word ->
    charCount += word.length()
}
```

## Good

```groovy
def errorCount = logEntries.count { it.level == 'ERROR' }

def total = cart.sum { it.price * it.quantity }

def charCount = words.sum { it.length() }

// count without closure — counts truthy elements
def nonNulls = items.count { it != null }   // explicit
def nonNulls = items.findAll { it != null }.size()

// count(null) — counts null elements
def nulls = items.count(null)

// sum with initial value
def total = cart.sum(0) { it.price * it.quantity }

// sum of simple values
def numbers = [1, 2, 3, 4, 5]
assert numbers.sum() == 15
assert numbers.sum(100) == 115   // With initial value
```

## Built-in Statistics

```groovy
def values = [10, 20, 30, 40, 50]

assert values.min() == 10
assert values.max() == 50
assert values.sum() == 150
assert values.average() == 30.0   // Groovy 3+

// On specific fields
def best = products.max { it.rating }
def cheapest = products.min { it.price }

// Joining
assert ['a', 'b', 'c'].join(', ') == 'a, b, c'
```

## See Also

- [col-inject-reduce](col-inject-reduce.md) - Use inject for accumulation
- [col-any-every](col-any-every.md) - Use any/every for boolean checks
- [col-collect-over-map](col-collect-over-map.md) - Use collect for transformations
