# col-unique-distinct

> Use `.unique()` over manual deduplication

## Why It Matters

Manual deduplication with temporary sets or nested loops is error-prone and obscures intent. Groovy's `.unique()` and `.toUnique()` methods provide concise, readable deduplication that handles `null` elements correctly.

## Bad

```groovy
def seen = []
def deduped = []
items.each { item ->
    if (!(item in seen)) {
        seen << item
        deduped << item
    }
}

def uniqueNames = []
users.each { user ->
    if (!uniqueNames.contains(user.name)) {
        uniqueNames << user.name
    }
}

def byId = [:]
def result = []
users.each { user ->
    if (!byId.containsKey(user.id)) {
        byId[user.id] = user
        result << user
    }
}
```

## Good

```groovy
def deduped = items.unique()

def uniqueNames = users*.name.unique()

// Unique by a property
def byId = users.unique { it.id }

// Unique by multiple properties
def byRegionAndRole = users.unique { [it.region, it.role] }

// Non-mutating version
def newList = items.toUnique()
```

## Custom Uniqueness

```groovy
// Case-insensitive unique
def names = ['Alice', 'alice', 'Bob', 'bob', 'ALICE']
def result = names.unique { it.toLowerCase() }
assert result == ['Alice', 'Bob']

// Unique with comparator
def items = [[1, 2], [1, 2], [3, 4]]
def unique = items.unique { a, b -> a <=> b }

// Using a Set for large collections
def unique = new LinkedHashSet(users*.email).toList()
```

## See Also

- [col-sort-compare](col-sort-compare.md) - Use sort with closures
- [col-find-results](col-find-results.md) - Use findAll for filtering
- [col-grep-filter](col-grep-filter.md) - Use grep for type filtering
