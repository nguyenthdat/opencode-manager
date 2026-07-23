# perf-first-index-vs-filter

> Use `first(where:)` instead of `filter().first`

## Why It Matters

`filter(_:)` walks the entire collection and allocates a new array containing every match before `.first` picks the first one, even though only one element was ever needed. `first(where:)` walks the collection and returns as soon as it finds a match, doing no allocation and, for a match found early, far less work—especially significant on large collections or when the match is likely near the start.

## Bad

```swift
func firstAdmin(in users: [User]) -> User? {
    users.filter { $0.role == .admin }.first
    // Scans the entire array and allocates a new [User] for all matches,
    // just to throw away everything but the first one.
}

func firstNegativeIndex(in numbers: [Int]) -> Int? {
    numbers.filter { $0 < 0 }.first.map { numbers.firstIndex(of: $0)! } // doubly wasteful
}
```

## Good

```swift
func firstAdmin(in users: [User]) -> User? {
    users.first { $0.role == .admin } // stops at the first match, no allocation
}

func firstNegativeIndex(in numbers: [Int]) -> Int? {
    numbers.firstIndex { $0 < 0 } // single pass, returns the index directly
}
```

## When `filter` Is Actually the Right Call

```swift
// If you genuinely need ALL matches (not just the first), filter is
// correct and first(where:) doesn't apply.
func allAdmins(in users: [User]) -> [User] {
    users.filter { $0.role == .admin }
}

// If you need to know both "does a match exist" and its count, contains
// or a single filter pass (not two first-where scans) is appropriate.
func hasMultipleAdmins(in users: [User]) -> Bool {
    users.filter { $0.role == .admin }.count > 1
}
```

## See Also

- [`perf-lazy-sequence`](perf-lazy-sequence.md) - Deferring work in longer chains
- [`perf-profile-instruments`](perf-profile-instruments.md) - Confirming the scan is actually hot
- [`perf-avoid-existential-boxing`](perf-avoid-existential-boxing.md) - Avoiding overhead in predicate closures over `any`
