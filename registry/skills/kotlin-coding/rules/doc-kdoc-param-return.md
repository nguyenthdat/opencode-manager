# doc-kdoc-param-return

> Document `@param`/`@return` when the signature isn't self-evident

## Why It Matters

A function signature like `fun resize(image: Image, w: Int, h: Int, keepAspect: Boolean): Image` doesn't tell a caller what unit `w`/`h` are in, what happens when `keepAspect` conflicts with the given dimensions, or what the returned `Image` looks like on edge cases — `@param`/`@return` close exactly those gaps that types alone can't express.

## Bad

```kotlin
/** Resizes an image. */
fun resize(image: Image, w: Int, h: Int, keepAspect: Boolean): Image {
    // ...
}
```

## Good

```kotlin
/**
 * Resizes [image] to the given target dimensions.
 *
 * @param w Target width in pixels. Must be positive.
 * @param h Target height in pixels. Must be positive.
 * @param keepAspect If `true`, [w] and [h] are treated as a bounding box and the image
 *   is scaled to fit within it while preserving its original aspect ratio; if `false`,
 *   the image is stretched to exactly `w x h`.
 * @return A new [Image] with the resized pixel data; [image] itself is left unmodified.
 */
fun resize(image: Image, w: Int, h: Int, keepAspect: Boolean): Image {
    // ...
}
```

## When to Skip @param/@return

```kotlin
/** Returns the user's display name, falling back to their email if no name is set. */
fun displayName(user: User): String = user.name ?: user.email
```

When the summary sentence already fully explains the single parameter and return value (as above), redundant `@param user` / `@return the display name` tags add noise without adding information — use judgment rather than mechanically tagging every parameter.

## Documenting Nullability and Defaults

```kotlin
/**
 * Looks up a cached entry for [key].
 *
 * @param key Cache key; case-sensitive.
 * @param default Value returned if [key] is absent. Defaults to `null`.
 * @return The cached value for [key], or [default] if not present.
 */
fun <T> Cache<T>.getOrDefault(key: String, default: T? = null): T? {
    // ...
}
```

## See Also

- [`doc-kdoc-public-api`](doc-kdoc-public-api.md) - the broader rule this refines
- [`doc-kdoc-throws-tag`](doc-kdoc-throws-tag.md) - documenting exceptional outcomes alongside normal returns
- [`doc-kdoc-sample-tag`](doc-kdoc-sample-tag.md) - showing usage with a compiled example instead of prose alone
