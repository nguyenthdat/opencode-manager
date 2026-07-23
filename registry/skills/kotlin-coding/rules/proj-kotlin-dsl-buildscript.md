# proj-kotlin-dsl-buildscript

> Write Gradle build scripts in Kotlin DSL (`build.gradle.kts`)

## Why It Matters

Groovy build scripts have no static typing, so typos in a task name or property fail at execution time, often minutes into a build, with a confusing stack trace. Kotlin DSL gives IDE autocomplete, compile-time checking of the build script itself, and lets you refactor build logic with the same tools you use for application code.

## Bad

```groovy
// build.gradle (Groovy)
dependencies {
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0'
    // Typo in config name - fails at execution, not at edit time
    testImplemenation 'junit:junit:4.13.2'
}

android {
    compileSdkVersion 34
    defaultConfig {
        minSdkVersion 24
    }
}
```

## Good

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "2.1.0"
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
    testImplementation(kotlin("test"))
    // IDE flags `testImplemenation` as unresolved before you ever run Gradle
}

kotlin {
    jvmToolchain(21)
}

tasks.test {
    useJUnitPlatform()
}
```

## Migration Tip

Migrate one file at a time (`settings.gradle` → `settings.gradle.kts` first, since Gradle needs a consistent script type per project), and lean on `libs.versions.toml` (see `proj-version-catalog-libs`) so version strings aren't duplicated across Kotlin DSL files either.

## See Also

- [`proj-version-catalog-libs`](proj-version-catalog-libs.md) - centralize the dependency coordinates referenced from `.kts` files
- [`proj-buildsrc-convention-plugins`](proj-buildsrc-convention-plugins.md) - share Kotlin DSL logic across modules instead of copy-pasting it
- [`proj-gradle-multi-module`](proj-gradle-multi-module.md) - each new module gets its own typed build script
