# err-elvis-default

> Use `?:` (Elvis) for default values when null

## Why It Matters

The Elvis operator `?:` provides a concise, idiomatic way to supply default values when an expression evaluates to `null` or `false` (in Groovy truth). It eliminates repetitive `if (x == null)` guards and ternary expressions, keeping code compact and readable.

## Bad

```groovy
def name = user.name != null ? user.name : 'Anonymous'

def port = config.server.port
if (port == null) {
    port = 8080
}

def displayName
if (user.nickname) {
    displayName = user.nickname
} else {
    displayName = user.fullName
}
```

## Good

```groovy
def name = user.name ?: 'Anonymous'

def port = config.server.port ?: 8080

def displayName = user.nickname ?: user.fullName
```

## Elvis in Practice

```groovy
// Chaining defaults
def label = user.alias ?: user.nickname ?: user.name ?: 'Unknown'

// With method calls
def status = order?.status ?: OrderStatus.PENDING

// In assignments
settings.timeout = env.TIMEOUT?.toInteger() ?: 30

// In string interpolation
println "Hello, ${user.name ?: 'Guest'}!"

// With closure results
def result = computeExpensive(data) ?: fallbackValue

// Elvis with Groovy truth: treats empty strings/collections as falsy
def tags = article.tags ?: ['untagged']    // Covers null AND []

def title = post.title?.trim() ?: '(No Title)'  // Covers null, blank, and whitespace-only
```

## Gotcha: Zero and False

```groovy
// Be careful: 0 and false are falsy in Groovy
def count = items.size() ?: 0     // Safe — returns 0 or the size
def score = game.score ?: 0       // DANGER: replaces score=0 with 0!
def enabled = feature.enabled ?: true  // DANGER: replaces false with true

// Better: use explicit null checks for numeric/boolean values
def score = game.score != null ? game.score : 0
def enabled = feature.enabled != null ? feature.enabled : true
```

## See Also

- [err-safe-navigation](err-safe-navigation.md) - Use ?. for null-safe traversal
- [err-groovy-truth](err-groovy-truth.md) - Understand Groovy truth behavior
- [err-no-null-returns](err-no-null-returns.md) - Return Optional, not null
