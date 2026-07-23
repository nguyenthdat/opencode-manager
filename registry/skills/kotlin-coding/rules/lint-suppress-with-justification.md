# lint-suppress-with-justification

> Require a comment justification alongside any `@Suppress`

## Why It Matters

A bare `@Suppress("TooGenericExceptionCaught")` with no explanation is indistinguishable from someone silencing a real problem to get past CI, and six months later nobody — including the original author — remembers whether it's still safe. Pairing every suppression with a one-line comment explaining why turns it into a reviewable, auditable decision instead of a black hole.

## Bad

```kotlin
@Suppress("TooGenericExceptionCaught")
fun loadPlugin(path: String): Plugin? {
    return try {
        loader.load(path)
    } catch (e: Exception) {
        null
    }
}
// Why is a generic catch OK here? Was this reviewed, or just silenced
// to unblock a PR? No way to tell six months later.
```

## Good

```kotlin
// Third-party plugin loading can throw arbitrary exception types
// (ClassNotFoundException, LinkageError subclasses, plugin-specific
// exceptions) - catching Exception broadly is intentional here so one
// bad plugin doesn't crash the host application.
@Suppress("TooGenericExceptionCaught")
fun loadPlugin(path: String): Plugin? {
    return try {
        loader.load(path)
    } catch (e: Exception) {
        logger.warn(e) { "Failed to load plugin at $path" }
        null
    }
}
```

## Detekt Rule to Enforce This

```yaml
# config/detekt.yml
style:
  ForbiddenSuppress:
    active: true
    rules: [] # allow all suppressions, but pair with a custom rule (see
              # lint-detekt-custom-rules) that requires an adjacent comment
```

Some teams write a small custom detekt rule that fails if `@Suppress` appears without a comment on the preceding line — enforcing the convention rather than relying on review discipline alone.

## See Also

- [`lint-detekt-baseline`](lint-detekt-baseline.md) - the bulk alternative for pre-existing violations vs. one-off suppression
- [`lint-detekt-custom-rules`](lint-detekt-custom-rules.md) - write a rule that enforces this convention automatically
- [`err-no-catch-generic-exception`](err-no-catch-generic-exception.md) - the rule this example's suppression is justifying an exception to
