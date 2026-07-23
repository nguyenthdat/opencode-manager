# col-flatten-collectMany

> Use `.flatten()` or `.collectMany{}` over nested loops

## Why It Matters

Nested loops that collect results from inner iterations are verbose and obscure the "flatten nested structure" intent. `.flatten()` and `.collectMany{}` (flatMap equivalent) express this directly, producing a single-level list from nested structures in one call.

## Bad

```groovy
def allTags = []
articles.each { article ->
    article.tags.each { tag ->
        allTags << tag
    }
}

def allNumbers = []
for (group in groups) {
    for (num in group.numbers) {
        allNumbers << num
    }
}

def expanded = []
items.each { item ->
    def variants = buildVariants(item)
    variants.each { variant ->
        expanded << variant
    }
}
```

## Good

```groovy
def allTags = articles.collectMany { it.tags }

def allNumbers = groups.collectMany { it.numbers }

def expanded = items.collectMany { item -> buildVariants(item) }

// flatten nested collections
def nested = [[1, 2], [3, 4], [5, 6]]
assert nested.flatten() == [1, 2, 3, 4, 5, 6]

// flatten with depth control
def deepNested = [[[1, 2]], [[3, 4]]]
assert deepNested.flatten(2) == [1, 2, 3, 4]
```

## collectMany vs flatten

```groovy
// collectMany — transform each element into an iterable and concatenate
def words = ['hello world', 'foo bar']
def letters = words.collectMany { it.toList() }
assert letters == ['h','e','l','l','o',' ','w','o','r','l','d','f','o','o',' ','b','a','r']

// flatten — flatten an already-nested structure
def matrix = [[1, 2, 3], [4, 5, 6]]
assert matrix.flatten() == [1, 2, 3, 4, 5, 6]

// Combined: find all unique tags across articles
def uniqueTags = articles*.tags.flatten().unique()

// collectMany with index
def pairs = items.collectMany { item ->
    [item, transform(item)]
}
```

## See Also

- [col-collect-over-map](col-collect-over-map.md) - Use collect for transformations
- [col-spread-dot](col-spread-dot.md) - Use *. for all-element access
- [col-unique-distinct](col-unique-distinct.md) - Use unique for deduplication
