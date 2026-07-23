# perf-coll-init-capacity

> Initialize collections with known capacity

## Why It Matters

Java collections like `ArrayList` and `HashMap` start with a default small capacity and grow by reallocating and copying when full. If the final size is known, pre-sizing avoids multiple reallocations. This is especially important in loops where collections are built incrementally.

## Bad

```groovy
def users = []
(1..10_000).each { i ->
    users << new User(id: i, name: "User $i")    // ArrayList grows ~12 times internally
}

def lookup = [:]
users.each { user ->
    lookup[user.id] = user    // HashMap rehashes multiple times
}
```

## Good

```groovy
def count = 10_000
def users = new ArrayList<>(count)
(1..count).each { i ->
    users << new User(id: i, name: "User $i")
}

def lookup = new LinkedHashMap<>(count)
users.each { user ->
    lookup[user.id] = user
}

// When size is approximate, over-estimate slightly
def approxSize = estimatedRowCount * 1.1 as int
def buffer = new ArrayList<>(approxSize)
```

## Collection Capacity Tips

```groovy
// ArrayList — initial capacity
def list = new ArrayList<>(1000)

// HashMap — capacity = expectedSize / loadFactor (0.75)
def map = new HashMap<>(1334)  // For ~1000 entries: 1000/0.75 ≈ 1334

// LinkedHashMap — same
def linked = new LinkedHashMap<>(initialCapacity)

// HashSet — same as HashMap
def set = new HashSet<>(1334)

// Guava provides convenience
// def list = Lists.newArrayListWithExpectedSize(1000)
// def map = Maps.newHashMapWithExpectedSize(1000)
```

## See Also

- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for production
- [perf-primitive-types](perf-primitive-types.md) - Use primitive types over boxed
- [col-immutable-collections](col-immutable-collections.md) - Use @Immutable or asImmutable
