# err-groovy-truth

> Understand Groovy truth for null/empty/zero checks

## Why It Matters

Groovy truth is the implicit boolean evaluation that treats `null`, empty strings, empty collections, zero numbers, and `false` as falsy. While convenient for conditionals, it can cause subtle bugs when `0` or `false` are valid values. Understanding the exact rules prevents both over-defensive code and unexpected behavior.

## Bad

```groovy
def score = game.leaderboard.getScore(player)

if (score) {           // BUG: score=0 is falsy; player with 0 points treated as absent
    showRanking(score)
}

def enabled = feature.flags.searchEnabled
if (!enabled) {        // BUG: enabled=false is falsy — expected behavior?
    // But what if enabled is null (unconfigured)?
    disableSearch()
}

if (user.age) {        // BUG: 0-year-old is falsy; doesn't make sense for age
    categorize(user)
}
```

## Good

```groovy
def score = game.leaderboard.getScore(player)

if (score != null) {            // Explicit: "was a score recorded?"
    showRanking(score)
}

def enabled = feature.flags.searchEnabled
if (enabled == false) {         // Explicit: "is it explicitly disabled?"
    disableSearch()
} else if (enabled == true) {
    enableSearch()
} else {
    useDefaultSearchBehavior()  // null = unconfigured
}

// Groovy truth is great for things that should be non-empty
if (user.name) {                // Fine: name should never be empty string or null
    greet(user)
}

if (order.items) {              // Fine: items should never be null or empty
    process(order)
}
```

## Groovy Truth Table

```groovy
// Falsy values in Groovy
assert !null
assert !false
assert !0
assert !0.0
assert !''
assert ![]
assert ![:]
assert !new Object[0]

// Truthy values
assert true
assert 1
assert -1
assert 'hello'
assert [1]
assert [null]                  // Non-empty list is truthy even with null elements
assert ['': '']                // Non-empty map is truthy
assert new Object()
assert { true }                // Closures are truthy
```

## See Also

- [err-elvis-default](err-elvis-default.md) - Use Elvis for default values
- [err-safe-navigation](err-safe-navigation.md) - Use ?. for null-safe traversal
- [err-avoid-npe](err-avoid-npe.md) - Prevent NullPointerException
