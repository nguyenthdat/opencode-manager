# proj-version-catalog-libs

> Centralize dependency versions in a Gradle version catalog (`libs.versions.toml`)

## Why It Matters

Hardcoding version strings in every module's `build.gradle.kts` means upgrading a library requires a project-wide search-and-replace, and it's easy for two modules to silently drift onto different versions of the same dependency, causing runtime classpath conflicts. A version catalog gives one source of truth with typed, autocompletable accessors.

## Bad

```kotlin
// feature/checkout/build.gradle.kts
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
}

// feature/profile/build.gradle.kts
dependencies {
    // Drifted to a different version - nobody updated this one
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
}
```

## Good

```toml
# gradle/libs.versions.toml
[versions]
kotlin = "2.1.0"
coroutines = "1.9.0"

[libraries]
kotlinx-coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "coroutines" }
kotlinx-coroutines-test = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-test", version.ref = "coroutines" }

[plugins]
kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
```

```kotlin
// feature/checkout/build.gradle.kts and feature/profile/build.gradle.kts
// both reference the same catalog entry - impossible to drift
dependencies {
    implementation(libs.kotlinx.coroutines.core)
    testImplementation(libs.kotlinx.coroutines.test)
}
```

## Bundles for Related Dependencies

```toml
[bundles]
networking = ["ktor-client-core", "ktor-client-content-negotiation", "kotlinx-serialization-json"]
```

```kotlin
dependencies {
    implementation(libs.bundles.networking)
}
```

## See Also

- [`proj-kotlin-dsl-buildscript`](proj-kotlin-dsl-buildscript.md) - the catalog is consumed from typed Kotlin DSL scripts
- [`proj-buildsrc-convention-plugins`](proj-buildsrc-convention-plugins.md) - convention plugins reference the same catalog
- [`proj-gradle-multi-module`](proj-gradle-multi-module.md) - a catalog keeps versions consistent as module count grows
