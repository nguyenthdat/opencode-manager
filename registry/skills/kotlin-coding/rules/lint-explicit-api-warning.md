# lint-explicit-api-warning

> Fail CI on missing visibility modifiers in explicit-API mode

## Why It Matters

Enabling `explicitApi()` locally only helps if developers actually see the warnings before merging; if CI doesn't fail on them, a public declaration with a missing modifier slips through review the same way any warning does. Promoting explicit-API violations from warnings to CI-blocking errors is what makes the mode actually enforce library API discipline instead of just suggesting it.

## Bad

```kotlin
// build.gradle.kts
kotlin {
    explicitApiWarning() // stays a warning forever, nobody escalates it
}
```

```kotlin
package com.example.httpclient

// Missing `public`/`internal` and missing return type - only a warning,
// merges anyway, and this becomes permanent public API by accident
class RequestBuilder {
    fun build() = RequestImpl()
}
```

## Good

```kotlin
// build.gradle.kts
kotlin {
    explicitApi() // ExplicitApiMode.Strict - these are compile errors
}
```

```kotlin
package com.example.httpclient

public class RequestBuilder {
    public fun build(): HttpRequest = RequestImpl()
}
// error: Visibility must be specified in explicit API mode
// error: Return type must be specified in explicit API mode
// Build fails until fixed - can't merge an accidental public leak
```

```bash
# CI pipeline step - fails the build on explicit-API violations,
# same as any other compile error
./gradlew build
```

## Migrating an Existing Library

Start with `explicitApiWarning()` for one release cycle while the team adds modifiers, then flip to `explicitApi()` (strict) and make that the CI gate — don't leave it in warning mode indefinitely, since warnings that never fail a build get ignored.

## See Also

- [`proj-explicit-api-mode`](proj-explicit-api-mode.md) - the Gradle feature this rule enforces in CI
- [`lint-ci-lint-gate`](lint-ci-lint-gate.md) - the broader CI gate this becomes part of
- [`lint-compiler-warnings-as-errors`](lint-compiler-warnings-as-errors.md) - the general principle of not letting warnings sit unenforced
