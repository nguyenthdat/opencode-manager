# perf-lazy-sequence

> Use `lazy` sequences to avoid intermediate allocations

## Why It Matters

Chaining eager `map`/`filter` calls on a collection allocates a brand-new array after every step, even if only a handful of elements from the final result are actually consumed. `.lazy` defers all of that work into a single pass computed on demand, which avoids the intermediate allocations entirely and can turn an O(n) full-collection transform into effectively O(k) work when only the first `k` results are needed.

## Bad

```swift
func firstThreeActiveUppercasedNames(_ users: [User]) -> [String] {
    // Allocates a full filtered array, then a full mapped array,
    // even though only 3 results are needed.
    let active = users.filter { $0.isActive }
    let names = active.map { $0.name.uppercased() }
    return Array(names.prefix(3))
}
```

## Good

```swift
func firstThreeActiveUppercasedNames(_ users: [User]) -> [String] {
    let result = users.lazy
        .filter { $0.isActive }
        .map { $0.name.uppercased() }
        .prefix(3)
    return Array(result) // only as many elements as needed are ever computed
}
```

## When Eager Evaluation Is Actually Better

```swift
// If you need the whole collection anyway (no early termination, no
// prefix/first), lazy adds indirection overhead for no benefit—
// each element re-runs the whole lazy chain on every access instead of
// being computed once and stored.
func allActiveUppercasedNames(_ users: [User]) -> [String] {
    users.filter { $0.isActive }.map { $0.name.uppercased() } // eager is fine/better here
}

// Lazy shines when combined with early-exit operations:
func firstMatchingLazily(_ numbers: [Int]) -> Int? {
    numbers.lazy
        .map { $0 * $0 }
        .first { $0 > 1000 } // stops as soon as a match is found
}
```

## See Also

- [`perf-first-index-vs-filter`](perf-first-index-vs-filter.md) - Preferring `first(where:)` for single-match lookups
- [`perf-reserve-capacity`](perf-reserve-capacity.md) - Avoiding reallocation when eager output is needed
- [`perf-profile-instruments`](perf-profile-instruments.md) - Confirming laziness actually helps your case
