# fn-collection-vs-sequence-tradeoff

> Know when eager `List` operations beat `Sequence` overhead on small data

## Why It Matters

`Sequence` isn't free: each element is wrapped and passed through a chain of iterator objects, which has more per-element overhead than the tight, specialized loops the standard library uses for `List` operators. For small collections or single-operator chains, that overhead outweighs any laziness benefit, so reaching for `asSequence()` everywhere can make code both slower and harder to read for no reason.

## Bad

```kotlin
// Single operator, small list - Sequence adds iterator/wrapper overhead for nothing
fun activeUserNames(users: List<User>): List<String> =
    users.asSequence()
        .filter { it.isActive }
        .map { it.name }
        .toList()

// Even worse: forcing a Sequence through toList() immediately negates laziness
fun namesEager(users: List<User>): List<String> =
    users.asSequence().map { it.name }.toList()  // just use users.map { it.name }
```

## Good

```kotlin
// Small collection, few operators - plain List operations are simpler and faster
fun activeUserNames(users: List<User>): List<String> =
    users.filter { it.isActive }.map { it.name }

// Reserve Sequence for genuinely long chains or large/unbounded sources
fun firstActiveAdmin(users: List<User>): User? =
    users.asSequence()
        .filter { it.isActive }
        .filter { it.isAdmin }
        .map { it.withResolvedPermissions() }
        .firstOrNull()
```

## Rule of Thumb

```kotlin
// Use Sequence when:
// 1. The chain has 3+ intermediate operators, OR
// 2. The collection is large (thousands+ elements), OR
// 3. A short-circuiting terminal op (first, find, take, any) can stop early, OR
// 4. The source itself is a lazy/infinite generator.
val fibonacci = generateSequence(0 to 1) { (a, b) -> b to (a + b) }
    .map { it.first }
    .take(10)
    .toList()

// Use List when:
// 1. The collection is small, OR
// 2. There's only one or two operators, OR
// 3. You need the result materialized immediately anyway.
val doubled = listOf(1, 2, 3).map { it * 2 }
```

## Evidence

The Kotlin standard library source itself only reaches for `Sequence` internally in APIs explicitly documented as lazy (`generateSequence`, `Regex.findAll`); everyday `List` transformations throughout kotlinx libraries stay on eager collection operators unless chaining is deep.

## See Also

- [`fn-sequence-for-laziness`](fn-sequence-for-laziness.md) - when laziness is the right call
- [`perf-sequence-large-collections`](perf-sequence-large-collections.md) - measured performance tradeoffs
- [`perf-profile-before-optimize`](perf-profile-before-optimize.md) - don't guess, measure before switching
