# proj-buildsrc-convention-plugins

> Share build logic with convention plugins in `build-logic`/`buildSrc`

## Why It Matters

Copy-pasting the same `kotlinOptions`, detekt configuration, and dependency block into every module's `build.gradle.kts` means a policy change (raising the JVM target, adding a lint rule) requires editing N files and inevitably missing one. Convention plugins package that shared configuration as reusable, typed Gradle plugins applied with one line per module.

## Bad

```kotlin
// feature/checkout/build.gradle.kts
kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_21)
        allWarningsAsErrors.set(true)
    }
}
detekt {
    config.setFrom("$rootDir/config/detekt.yml")
}

// feature/profile/build.gradle.kts
// ... the exact same 8 lines, pasted again, already drifting
kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17) // someone forgot to update this one
    }
}
```

## Good

```kotlin
// build-logic/src/main/kotlin/example.kotlin-common.gradle.kts
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("io.gitlab.arturbosch.detekt")
    kotlin("jvm")
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_21)
        allWarningsAsErrors.set(true)
    }
}

detekt {
    config.setFrom("$rootDir/config/detekt.yml")
}
```

```kotlin
// feature/checkout/build.gradle.kts
plugins {
    id("example.kotlin-common")
}
// One line, always in sync with every other module
```

```kotlin
// build-logic/settings.gradle.kts registers the included build:
// settings.gradle.kts (root)
pluginManagement {
    includeBuild("build-logic")
}
```

## See Also

- [`proj-version-catalog-libs`](proj-version-catalog-libs.md) - convention plugins reference the same catalog for consistency
- [`lint-detekt-baseline`](lint-detekt-baseline.md) - the detekt config a convention plugin typically centralizes
- [`lint-compiler-warnings-as-errors`](lint-compiler-warnings-as-errors.md) - a compiler flag best set once, here, not per module
