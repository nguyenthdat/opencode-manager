# err-catch-specific

> Catch specific exceptions, not `Exception`

## Why It Matters

Catching `Exception` or `Throwable` masks programming errors, swallows unexpected failures, and makes debugging nearly impossible. Specific exception handling communicates intent, preserves stack traces, and prevents bugs from silently propagating.

## Bad

```groovy
try {
    def content = new URL(url).text
    def parsed = new JsonSlurper().parseText(content)
    processData(parsed)
} catch (Exception e) {
    // Swallows everything: network errors, parse errors, NPE, etc.
    log.error("Something went wrong: ${e.message}")
    return null
}
```

## Good

```groovy
try {
    def content = new URL(url).text
    def parsed = new JsonSlurper().parseText(content)
    processData(parsed)
} catch (MalformedURLException e) {
    log.error("Invalid URL: $url", e)
    throw new IllegalArgumentException("Bad URL: $url", e)
} catch (IOException e) {
    log.error("Network error fetching $url", e)
    throw new ServiceException("Unable to reach service", e)
} catch (JsonException e) {
    log.error("Invalid JSON response from $url", e)
    throw new ParseException("Response was not valid JSON", e)
}
```

## Multi-Catch

```groovy
try {
    executeStep()
} catch (IOException | TimeoutException e) {
    // Handle related failures the same way
    log.warn("Transient error: ${e.message}")
    retry()
}
```

## See Also

- [err-avoid-checked-to-unchecked](err-avoid-checked-to-unchecked.md) - Don't silence checked exceptions
- [err-custom-exception](err-custom-exception.md) - Create domain-specific exceptions
- [anti-bare-catch](anti-bare-catch.md) - Don't catch Exception without specific handling
