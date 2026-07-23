# err-avoid-npe

> Prevent `NullPointerException` with safe navigation

## Why It Matters

`NullPointerException` is the most common runtime exception in JVM languages. Groovy provides multiple mechanisms to avoid NPE: safe navigation (`?.`), Elvis operator (`?:`), the `@NullCheck` annotation, and Groovy truth. Proactively preventing NPE eliminates the most common source of production crashes.

## Bad

```groovy
def getCountry(Order order) {
    order.customer.address.country  // NPE if any link is null
}

def process(data) {
    def result = data.values         // NPE if data is null
    result = result.toUpperCase()    // NPE if result is null
    return result
}

def cache = [:]
def get(String key) {
    cache[key]   // Returns null for missing keys — callers may NPE
}
```

## Good

```groovy
def getCountry(Order order) {
    order?.customer?.address?.country ?: 'Unknown'
}

def process(data) {
    data?.values?.toUpperCase() ?: ''
}

def cache = [:]
def get(String key) {
    cache.get(key)   // Explicit null return documented; callers use ?.
}

// Or with default
def getOrDefault(String key, def defaultValue) {
    cache.get(key, defaultValue)
}

// @NullCheck annotation on method parameters
@groovy.transform.NullCheck
def greet(String name) {
    "Hello, $name"
}
// greet(null) throws IllegalArgumentException with clear message
```

## Systematic Approach

```groovy
@groovy.transform.TypeChecked
class SafeService {
    // Compile-time checks for null return paths
    String? findNickname(User user) {   // Explicitly nullable return type
        user?.profile?.nickname
    }

    // Non-null return type contract
    String getDisplayName(User user) {
        user?.profile?.nickname ?: user?.name ?: 'Anonymous'
    }
}
```

## See Also

- [err-safe-navigation](err-safe-navigation.md) - Use ?. for null-safe traversal
- [err-elvis-default](err-elvis-default.md) - Use Elvis for default values
- [err-groovy-truth](err-groovy-truth.md) - Understand Groovy truth
