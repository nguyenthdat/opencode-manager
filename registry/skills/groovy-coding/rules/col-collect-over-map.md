# col-collect-over-map

> Use `.collect{}` over manual list-building loops

## Why It Matters

Groovy's `.collect{}` method declaratively transforms each element into a new list, eliminating the boilerplate of creating an accumulator list and appending in a loop. It's more concise, less error-prone, and signals "transformation" to readers immediately.

## Bad

```groovy
def users = ['Alice', 'Bob', 'Charlie']
def upperNames = []
for (name in users) {
    upperNames << name.toUpperCase()
}

def products = fetchProducts()
def prices = []
products.each { product ->
    prices.add(product.price)
}

def enriched = []
items.eachWithIndex { item, i ->
    enriched << [index: i, value: item * 2, label: "Item-$i"]
}
```

## Good

```groovy
def users = ['Alice', 'Bob', 'Charlie']
def upperNames = users.collect { it.toUpperCase() }

def products = fetchProducts()
def prices = products.collect { it.price }

def enriched = items.collect { item ->
    [value: item * 2, label: "Item-$item"]
}

// collect with index via withIndex()
def indexed = items.withIndex().collect { item, i ->
    [index: i, data: item]
}
```

## Variations

```groovy
// collectEntries — build a map from a collection
def nameMap = users.collectEntries { user ->
    [(user.id): user.name]
}

// collectMany — flatMap equivalent
def allTags = articles.collectMany { article ->
    article.tags
}

// collect with initial value
def sums = items.collect([0]) { acc, val -> acc + val }
```

## See Also

- [closure-each-over-for](closure-each-over-for.md) - Prefer each over for loops
- [col-flatten-collectMany](col-flatten-collectMany.md) - Use flatten or collectMany
- [col-inject-reduce](col-inject-reduce.md) - Use inject for accumulation
