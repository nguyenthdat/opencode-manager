# col-any-every

> Use `.any{}` and `.every{}` for boolean checks

## Why It Matters

`.any{}` and `.every{}` directly express boolean aggregation over collections. They short-circuit (stop iterating once the answer is known), making them more efficient and more readable than manual flag-and-loop patterns.

## Bad

```groovy
def hasAdmins = false
for (user in users) {
    if (user.role == 'admin') {
        hasAdmins = true
        break
    }
}

def allActive = true
for (user in users) {
    if (!user.active) {
        allActive = false
        break
    }
}
```

## Good

```groovy
def hasAdmins = users.any { it.role == 'admin' }

def allActive = users.every { it.active }

// Combined: validate all items meet criteria
def validOrder = order.items.every { it.quantity > 0 } &&
    order.items.any { it.price > 0 }
```

## Variations

```groovy
// any() / every() without closure — checks Groovy truth
assert [true, false, true].any()       // true (at least one truthy)
assert [true, true, true].every()      // true (all truthy)
assert [1, 2, 0].every()              // false (0 is falsy)

// Short-circuit behavior
def result = [1, 2, 3].any {
    println "Checking $it"
    it == 2    // Stops after checking 2, never reaches 3
}

// none() — opposite of any()
def noAdmins = users.none { it.role == 'admin' }

// Combining any and every
def hasBoth = users.any { it.admin } && users.any { it.moderator }
def allMatching = criteria.every { it.met }
```

## See Also

- [col-find-results](col-find-results.md) - Use findAll for filtering
- [col-count-sum](col-count-sum.md) - Use count and sum for aggregation
- [col-inject-reduce](col-inject-reduce.md) - Use inject for accumulation
