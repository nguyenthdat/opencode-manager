# col-ranges-efficiency

> Use ranges (`1..10`, `a..<z`) idiomatically

## Why It Matters

Groovy ranges are memory-efficient iterable objects that represent sequences without allocating all elements. They integrate with `switch`, slicing, random access, and collection methods. Using ranges instead of manual `for` loops or list generation is more idiomatic and often more performant.

## Bad

```groovy
def numbers = []
for (int i = 1; i <= 10; i++) {
    numbers << i
}

def letters = []
for (char c = 'a'; c <= 'z'; c++) {
    letters << c
}

for (int i = 0; i < items.size(); i++) {
    process(i, items[i])
}

// Filtering
def teens = []
ages.each { age ->
    if (age >= 13 && age <= 19) {
        teens << age
    }
}
```

## Good

```groovy
def numbers = (1..10).toList()

def letters = ('a'..'z').toList()

// Ranges in switch
def category = switch (age) {
    case 0..12 -> 'Child'
    case 13..19 -> 'Teen'
    case 20..120 -> 'Adult'
    default -> 'Unknown'
}

// Inclusive vs exclusive ranges
assert (1..5).toList() == [1, 2, 3, 4, 5]      // Inclusive
assert (1..<5).toList() == [1, 2, 3, 4]         // Exclusive end

// Range as filter
def teens = ages.grep(13..19)

// Slicing with ranges
def middle = items[5..<10]

// Step ranges (Groovy 4+)
assert (0..10).step(3).toList() == [0, 3, 6, 9]
```

## Ranges Integrated with GDK

```groovy
// Random from range
def roll = (1..6).toList()[new Random().nextInt(6)]

// Times loop
5.times { println it }    // 0, 1, 2, 3, 4

// Upto/downto
1.upto(5) { println it }  // 1, 2, 3, 4, 5
5.downto(1) { println it } // 5, 4, 3, 2, 1

// Step iterator
(0..10).step(2) { println it }  // 0, 2, 4, 6, 8, 10

// Date ranges
def thisMonth = (LocalDate.now().withDayOfMonth(1)..LocalDate.now())
```

## See Also

- [col-grep-filter](col-grep-filter.md) - Use grep for pattern filtering
- [col-combinations-permutations](col-combinations-permutations.md) - Use built-in combinatorics
- [closure-each-over-for](closure-each-over-for.md) - Prefer each over for loops
