# col-inject-reduce

> Use `.inject{}` over manual accumulator loops

## Why It Matters

`.inject{}` (fold/reduce) expresses accumulation patterns — sum, product, concatenation, building maps — in a single expression. Manual accumulator loops with temporary variables are verbose, separate initialization from logic, and are prone to off-by-one errors.

## Bad

```groovy
def total = 0
for (item in cartItems) {
    total += item.price * item.quantity
}

def merged = [:]
users.each { user ->
    merged[user.id] = user.name
}

def longest = ''
items.each { item ->
    if (item.length() > longest.length()) {
        longest = item
    }
}
```

## Good

```groovy
def total = cartItems.inject(0) { sum, item ->
    sum + item.price * item.quantity
}

def merged = users.inject([:]) { map, user ->
    map[user.id] = user.name
    map
}

def longest = items.inject('') { current, item ->
    item.length() > current.length() ? item : current
}
```

## Without Initial Value

```groovy
// When initial value is omitted, first element is used as initial
def product = numbers.inject { acc, n -> acc * n }
// Same as: numbers.inject(numbers[0]) { acc, n -> acc * n }

// Concatenation
def combined = lists.inject { acc, list -> acc + list }

// Finding max
def max = values.inject { current, v -> v > current ? v : current }
```

## See Also

- [col-count-sum](col-count-sum.md) - Use count and sum for aggregation
- [col-any-every](col-any-every.md) - Use any/every for boolean checks
- [col-collect-over-map](col-collect-over-map.md) - Use collect for transformations
