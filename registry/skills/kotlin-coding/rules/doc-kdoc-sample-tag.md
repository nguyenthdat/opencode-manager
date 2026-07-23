# doc-kdoc-sample-tag

> Use `@sample` to link a compiled, runnable usage example

## Why It Matters

Prose usage examples embedded as a `/** ```kotlin ... ``` */` code block in KDoc are never compiled, so they silently rot as the API evolves — a rename or signature change leaves a stale, misleading example in the generated docs. `@sample` instead points at a real function in your test/sample source set; because that function is compiled (and can even be run in CI), the example is guaranteed to stay in sync with the actual API.

## Bad

```kotlin
/**
 * Parses a duration string like "1h30m".
 *
 * Example:
 * ```
 * val d = parseDuration("1h30m")
 * println(d.toMinutes()) // 90
 * ```
 */
fun parseDuration(text: String): Duration {
    // ...
}
```

## Good

```kotlin
/**
 * Parses a duration string like "1h30m".
 *
 * @sample com.example.time.samples.parseDurationSample
 */
fun parseDuration(text: String): Duration {
    // ...
}
```

```kotlin
// src/samples/kotlin/com/example/time/samples/DurationSamples.kt
package com.example.time.samples

import com.example.time.parseDuration

fun parseDurationSample() {
    val duration = parseDuration("1h30m")
    println(duration.toMinutes()) // 90
}
```

## Gradle Wiring for a Samples Source Set

```kotlin
// build.gradle.kts
sourceSets {
    val samples by creating {
        kotlin.srcDir("src/samples/kotlin")
    }
}

tasks.named<DokkaTask>("dokkaHtml") {
    dokkaSourceSets.named("main") {
        samples.from("src/samples/kotlin")
    }
}
```

The sample function itself compiles against the real public API, so a breaking rename fails the build immediately instead of silently leaving a stale doc comment.

## See Also

- [`doc-kdoc-public-api`](doc-kdoc-public-api.md) - the base KDoc convention `@sample` extends
- [`doc-dokka-generation`](doc-dokka-generation.md) - rendering `@sample` into the generated HTML docs
- [`doc-kdoc-param-return`](doc-kdoc-param-return.md) - documenting the signature alongside the sample
