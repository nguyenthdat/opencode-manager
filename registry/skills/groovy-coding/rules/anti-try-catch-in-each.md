# anti-try-catch-in-each

> Don't use try-catch inside `.each{}`; use `.findResults{}`

## Why It Matters

Wrapping every iteration in try-catch is both slow and semantically wrong — it treats expected and unexpected failures the same way. `.findResults{}` naturally handles partial failures by returning null for failed items, which can be filtered. It separates error handling from iteration logic.

## Bad

```groovy
def fetchUserData(List<Long> userIds) {
    def results = []
    userIds.each { id ->
        try {
            results << api.fetchUser(id)   // Try-catch inside each!
        } catch (Exception e) {
            results << null                 // Masking the error
        }
    }
    results
}
```

## Good

```groovy
def fetchUserData(List<Long> userIds) {
    userIds.collect { id ->
        try {
            api.fetchUser(id)
        } catch (ApiException e) {
            log.warn("Failed to fetch user $id: ${e.message}")
            UserRecord.NOT_FOUND    // Sentinel value over null
        }
    }
}

// Better: separate concerns
def fetchUserData(List<Long> userIds) {
    def (success, failures) = userIds.split { id ->
        api.isAvailable(id)   // Check first
    }

    failures.each { id -> log.warn("User $id unavailable") }

    success.collect { id -> api.fetchUser(id) }
}
```

## See Also

- [closure-each-over-for](closure-each-over-for.md) - Prefer each over for loops
- [err-catch-specific](err-catch-specific.md) - Catch specific exceptions
- [col-collect-over-map](col-collect-over-map.md) - Use collect for transformations
