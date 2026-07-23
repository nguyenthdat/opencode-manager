# err-no-null-returns

> Return `Optional` or empty collection, not `null`

## Why It Matters

Returning `null` forces every caller to add null checks, which are easily forgotten and cause `NullPointerException` at runtime. Returning `Optional` or empty collections makes the possibility of absence explicit in the type system and encourages callers to handle it.

## Bad

```groovy
def findUser(String email) {
    def user = db.query("SELECT * FROM users WHERE email = ?", email)
    if (user.isEmpty()) return null    // Caller must remember to null-check
    user[0]
}

def getTags(Article article) {
    if (article.tags == null) return null
    article.tags
}

def user = findUser('alice@example.com')
println user.name   // NPE if not found
```

## Good

```groovy
def findUser(String email) {
    def user = db.query("SELECT * FROM users WHERE email = ?", email)
    user.isEmpty() ? Optional.empty() : Optional.of(user[0])
}

def getTags(Article article) {
    article.tags ?: []   // Always return a list
}

def user = findUser('alice@example.com')
user.ifPresent { u -> println u.name }

def tags = getTags(article)
tags.each { tag -> processTag(tag) }   // Safe — never null
```

## Patterns

```groovy
// Optional with mapping
def email = findUser('alice@example.com')
    .map { user -> user.email }
    .orElse('no-reply@company.com')

// Empty collections simplify downstream code
def products = findFeatureProducts(category)
// Always safe — no null check needed
products.each { product ->
    renderProduct(product)
}

// Combining with ?. and ?:
def cityName = findAddress(userId)
    .map { addr -> addr.city }
    .orElse('Unknown')
```

## See Also

- [err-safe-navigation](err-safe-navigation.md) - Use ?. for null-safe traversal
- [err-elvis-default](err-elvis-default.md) - Use Elvis for default values
- [anti-null-propagation](anti-null-propagation.md) - Don't return null
