# col-find-results

> Use `.findAll{}` over filtering loops

## Why It Matters

`.findAll{}` returns a new collection containing only matching elements, replacing the verbose pattern of creating an empty list, iterating, and conditionally appending. It expresses filtering intent clearly and composes with other collection methods.

## Bad

```groovy
def activeUsers = []
for (user in users) {
    if (user.active) {
        activeUsers << user
    }
}

def adults = []
people.each { person ->
    if (person.age >= 18) {
        adults.add(person)
    }
}

def recent = []
orders.each { order ->
    if (order.date.after(lastWeek)) {
        recent.add(order)
    }
}
```

## Good

```groovy
def activeUsers = users.findAll { it.active }

def adults = people.findAll { it.age >= 18 }

def recent = orders.findAll { order ->
    order.date.after(lastWeek)
}
```

## Related Find Methods

```groovy
// find — returns first match (or null)
def admin = users.find { it.role == 'admin' }

// findResult — returns null or transformed first match
def adminEmail = users.findResult { it.role == 'admin' ? it.email : null }

// findAll with type filtering
def strings = mixedList.findAll { it instanceof String }

// grep — shortcut for type filtering
def strings = mixedList.grep(String)

// findIndexOf / findLastIndexOf
def idx = users.findIndexOf { it.name == 'Alice' }

// findIndexValues — all indices matching
def indices = items.findIndexValues { it == null }
```

## See Also

- [col-collect-over-map](col-collect-over-map.md) - Use collect for transformations
- [col-grep-filter](col-grep-filter.md) - Use grep for type filtering
- [col-any-every](col-any-every.md) - Use any/every for boolean checks
