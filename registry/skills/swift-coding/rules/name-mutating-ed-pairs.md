# name-mutating-ed-pairs

> Pair mutating/non-mutating verbs (`sort`/`sorted`)

## Why It Matters

Swift's convention pairs an imperative verb (`sort()`) for the mutating version of an operation with the same verb's past-participle or `ing`-form (`sorted()`) for the version that returns a new value. This lets readers predict mutation just from the verb form, without checking the declaration—`array.sort()` obviously mutates, `array.sorted()` obviously doesn't.

## Bad

```swift
extension Array where Element: Comparable {
    // Both look like they might mutate—no way to tell from the name.
    mutating func sortAscending() { ... }
    func sortedAscendingCopy() -> [Element] { ... }
}

struct Path {
    // "normalize" and "normalized" exist, but here it's named inconsistently.
    mutating func normalizePath() { ... }
    func getNormalizedVersion() -> Path { ... }
}
```

## Good

```swift
extension Array where Element: Comparable {
    // stdlib convention: sort() mutates, sorted() returns a new array.
    mutating func sort() { ... }
    func sorted() -> [Element] { ... }
}

struct Path {
    mutating func normalize() { ... }
    func normalized() -> Path { ... }
}

struct Rectangle {
    mutating func flip() { ... }
    func flipped() -> Rectangle { ... }
}
```

## Verbs Without a Clean Past Participle

```swift
// When the verb doesn't form a natural "-ed"/"-ing" adjective, prefix the
// non-mutating version with "form" instead, per the API Design Guidelines.
extension String {
    mutating func union(_ other: Set<Character>) { ... }         // hypothetical mutating
    func formUnion(_ other: Set<Character>) -> Set<Character> { ... }
}

// Real stdlib examples following the same pattern:
var set: Set<Int> = [1, 2, 3]
set.formUnion([4, 5])          // mutating
let union = set.union([4, 5])  // non-mutating, returns new Set

var index = array.startIndex
array.formIndex(after: &index) // mutating
let next = array.index(after: index) // non-mutating
```

## See Also

- [`name-boolean-assertive`](name-boolean-assertive.md) - Naming Boolean properties
- [`name-factory-make-prefix`](name-factory-make-prefix.md) - Naming constructors
- [`api-immutable-by-default`](api-immutable-by-default.md) - Preferring non-mutating APIs by default
