# col-combinations-permutations

> Use built-in combinatorics methods

## Why It Matters

Groovy provides `.combinations()`, `.permutations()`, and `.subsequences()` on collections, eliminating hand-rolled recursive combinatorics code. These built-in methods are correct, tested, and more readable than ad-hoc implementations.

## Bad

```groovy
// Manual combinations
def combine(List items, int k) {
    def result = []
    def n = items.size()
    def indices = (0..<k).toList()
    while (true) {
        result << indices.collect { items[it] }
        int i = k - 1
        while (i >= 0 && indices[i] == i + n - k) i--
        if (i < 0) break
        indices[i]++
        for (int j = i + 1; j < k; j++) indices[j] = indices[j - 1] + 1
    }
    result
}

// Much simpler to read
def pairs = [1, 2, 3, 4].combinations()
```

## Good

```groovy
// Combinations: all subsets of given size
def items = ['A', 'B', 'C']
assert items.combinations() == [['A', 'B'], ['A', 'C'], ['B', 'C']]

// With explicit size
assert items.combinations(3) == [['A', 'B', 'C']]

// Cartesian product with combinations
def colors = ['red', 'blue']
def sizes = ['S', 'M', 'L']
def variants = [colors, sizes].combinations()
// [['red', 'S'], ['red', 'M'], ['red', 'L'], ['blue', 'S'], ...]

// Permutations
assert [1, 2, 3].permutations() == [
    [1, 2, 3], [1, 3, 2], [2, 1, 3],
    [2, 3, 1], [3, 1, 2], [3, 2, 1]
]

// Subsequences (power set minus empty)
assert [1, 2].subsequences() == [[1], [2], [1, 2]]
```

## Practical Use

```groovy
// Generate test parameter combinations
def browsers = ['Chrome', 'Firefox', 'Safari']
def platforms = ['Windows', 'Mac', 'Linux']
def testMatrix = [browsers, platforms].combinations()

// Generate all 2-item product bundles
def products = ['A', 'B', 'C', 'D']
def bundles = products.combinations(2)

// Schedule round-robin matches
def teams = ['T1', 'T2', 'T3', 'T4']
def matchups = teams.combinations(2)

// Generate SQL IN clauses in batches
def ids = (1..5000).toList()
def batches = ids.collate(1000)
```

## See Also

- [col-ranges-efficiency](col-ranges-efficiency.md) - Use ranges idiomatically
- [col-flatten-collectMany](col-flatten-collectMany.md) - Use flatten or collectMany
- [col-groupBy-partition](col-groupBy-partition.md) - Use groupBy for grouping
