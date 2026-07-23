# proj-gradle-multi-module

> Split a growing codebase into Gradle modules along architectural seams

## Why It Matters

A single monolithic Gradle module forces every change to recompile the entire codebase and lets any class reach into any other class with no enforced boundary. Splitting along real architectural seams (feature, layer, or platform boundaries) cuts incremental build times, enables parallel compilation, and makes dependency direction explicit instead of aspirational.

## Bad

```kotlin
// settings.gradle.kts
rootProject.name = "app"
include(":app")

// Everything lives in one module: UI, domain, data, network, all mixed
// app/src/main/kotlin/com/example/app/
//   ui/, domain/, data/, network/, db/  <- all compiled together, always
```

## Good

```kotlin
// settings.gradle.kts
rootProject.name = "app"
include(
    ":app",
    ":feature:profile",
    ":feature:checkout",
    ":core:network",
    ":core:database",
    ":core:design-system",
)

// feature/checkout/build.gradle.kts
plugins {
    id("com.android.library")
    kotlin("android")
}

dependencies {
    implementation(project(":core:network"))
    implementation(project(":core:design-system"))
    // No dependency on :feature:profile - siblings stay decoupled
}
```

## Choosing Seams

- **By feature** for app modules with independent teams/release cadence (`:feature:checkout`).
- **By layer** for shared libraries where `api`/`data`/`domain` have genuinely different change rates.
- **By platform** in Kotlin Multiplatform (`commonMain`, `androidMain`, `iosMain`) — see `proj-source-set-organization`.

Avoid modularizing purely for the sake of module count; a module boundary that isn't paired with a real dependency restriction (see `proj-internal-module-boundary`) just adds Gradle configuration overhead.

## Evidence

Large Android codebases (e.g. Now in Android sample app) organize as `:core:*` for shared infrastructure and `:feature:*` for screens, with `:app` only wiring navigation and DI — no feature module depends on another feature module directly.

## See Also

- [`proj-package-by-feature`](proj-package-by-feature.md) - apply the same seam inside a single module before splitting
- [`proj-internal-module-boundary`](proj-internal-module-boundary.md) - enforce the boundary you just drew
- [`proj-api-vs-impl-module`](proj-api-vs-impl-module.md) - further split a module's contract from its implementation
- [`proj-flat-small-projects`](proj-flat-small-projects.md) - know when not to modularize yet
