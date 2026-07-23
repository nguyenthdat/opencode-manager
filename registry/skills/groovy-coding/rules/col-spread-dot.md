# col-spread-dot

> Use `*.` (spread-dot) operator for all-element access

## Why It Matters

The spread-dot operator `*.` applies a property access or method call to every element in a collection, returning a list of results. It's the most concise way to extract a property from all elements or call a method on each, eliminating the need for `.collect{}`.

## Bad

```groovy
def names = users.collect { it.name }
def upperNames = users.collect { it.name.toUpperCase() }
def carModels = cars.collect { car -> "${car.make} ${car.model}" }

def prices = []
for (item in cartItems) {
    prices << item.price
}

def summaries = orders.collect { order ->
    order.summarize()
}
```

## Good

```groovy
def names = users*.name          // Shortest form for property access

def upperNames = users*.name*.toUpperCase()  // Chain spread-dot

def carModels = cars*.with { "${make} ${model}" }

def prices = cartItems*.price    // Much cleaner

def summaries = orders*.summarize()  // Method call on all elements
```

## Spread-Dot Limitations and Use Cases

```groovy
// Works with method calls (null-safe)
def descriptions = items*.getDescription()

// Null-safe: returns null for null elements
def mixed = [null, user1, user2]*.name
// Result: [null, 'Alice', 'Bob']

// Works with maps via spread-map operator
def map = [a: 1, b: 2, c: 3]
def pairs = map*.swap { key, value -> [key.toUpperCase(), value * 10] }

// Spread method arguments
def sum = Math.max(*numbers)   // Spread list elements as args

// Spread list into another list
def combined = [*list1, *list2]
```

## See Also

- [col-collect-over-map](col-collect-over-map.md) - Use collect for transformations
- [col-flatten-collectMany](col-flatten-collectMany.md) - Use flatten or collectMany
- [col-unique-distinct](col-unique-distinct.md) - Use unique for deduplication
