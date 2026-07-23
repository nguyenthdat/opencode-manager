# lint-compiler-warnings-as-errors

> Treat compiler warnings as errors (`allWarningsAsErrors`) in CI

## Why It Matters

Compiler warnings flag real problems — unchecked casts, deprecated API usage, unreachable code — but if they never fail the build, they accumulate silently until the log is too long for anyone to read, and genuinely dangerous warnings hide among cosmetic ones. Failing the build on warnings forces every warning to be fixed or explicitly suppressed with justification the moment it's introduced.

## Bad

```kotlin
// build.gradle.kts - warnings print but never block anything
kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_21)
    }
}

// Deprecated API usage compiles clean, warning scrolls by unnoticed
@Deprecated("Use parseOrNull instead")
fun parse(s: String): Int = s.toInt()

fun useIt() {
    val n = parse("42") // warning: 'parse' is deprecated, nobody sees it
}
```

## Good

```kotlin
// build.gradle.kts
kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_21)
        allWarningsAsErrors.set(providers.gradleProperty("ci").isPresent)
    }
}
```

```kotlin
fun useIt() {
    val n = parse("42")
    // error: 'parse' is deprecated. Use parseOrNull instead
    // Build fails in CI until this is fixed or explicitly suppressed
}
```

## Local Dev vs. CI

Gating `allWarningsAsErrors` behind a `ci` Gradle property (set via `-Pci=true` in the pipeline) keeps local iterative development unblocked by warnings while guaranteeing the merged code is warning-free.

```bash
# CI pipeline invocation
./gradlew build -Pci=true
```

## See Also

- [`lint-ci-lint-gate`](lint-ci-lint-gate.md) - the CI job that runs this alongside detekt/ktlint
- [`lint-explicit-api-warning`](lint-explicit-api-warning.md) - a specific warning category worth failing on
- [`doc-deprecated-replacewith`](doc-deprecated-replacewith.md) - the `@Deprecated` annotation this rule ensures nobody ignores
