# col-sort-compare

> Use `.sort{}` with closures over `Comparable` boilerplate

## Why It Matters

Groovy's `.sort{}` accepts a closure that acts as a comparator, eliminating the need to implement `Comparable` or create `Comparator` classes. Sort expressions are inline, readable, and support multi-field sorting with Groovy's spaceship operator `<=>`.

## Bad

```groovy
class Person implements Comparable<Person> {
    String name
    int age

    int compareTo(Person other) {
        name <=> other.name
    }
}

def byAge = new ArrayList<>(people)
Collections.sort(byAge, new Comparator<Person>() {
    int compare(Person a, Person b) {
        return a.age - b.age
    }
})
```

## Good

```groovy
class Person {
    String name
    int age
}

// Sort by name
def sorted = people.sort { it.name }

// Sort by age descending
def byAge = people.sort { a, b -> b.age <=> a.age }

// Multi-field sort (by dept, then by name)
def byDeptThenName = people.sort { a, b ->
    a.department <=> b.department ?: a.name <=> b.name
}

// Sort with closure returning Comparable
def byNameLength = people.sort { it.name.length() }

// Sort booleans (active first)
def activeFirst = users.sort { a, b ->
    (b.active <=> a.active) ?: a.name <=> b.name
}
```

## Spaceship Operator `<=>`

```groovy
// Returns -1, 0, or 1
assert (3 <=> 5) == -1
assert (5 <=> 5) == 0
assert (7 <=> 3) == 1

// Works with strings
assert ('apple' <=> 'banana') == -1

// Multi-field sort
users.sort { a, b ->
    a.lastName <=> b.lastName ?: a.firstName <=> b.firstName
}
```

## See Also

- [col-unique-distinct](col-unique-distinct.md) - Use unique for deduplication
- [col-find-results](col-find-results.md) - Use findAll for filtering
- [col-groupBy-partition](col-groupBy-partition.md) - Use groupBy for grouping
