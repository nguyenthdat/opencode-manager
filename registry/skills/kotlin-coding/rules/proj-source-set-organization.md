# proj-source-set-organization

> Organize Kotlin Multiplatform source sets (`commonMain`, `jvmMain`, etc.) by shared surface

## Why It Matters

Putting platform-specific code in `commonMain` "temporarily" (guarded by `expect`/`actual` sprinkled everywhere) or duplicating logic across `androidMain`/`iosMain` that could be shared defeats the purpose of multiplatform and creates two places to fix the same bug. Organizing source sets by how much code actually is shared — common, then intermediate targets, then platform-specific — keeps the `expect`/`actual` surface minimal and intentional.

## Bad

```kotlin
// commonMain/kotlin/Storage.kt
expect class Storage {
    fun save(key: String, value: String)
}
// jvmMain and iosMain both duplicate the SAME validation logic
// around the actual platform call, instead of sharing it

// jvmMain/kotlin/Storage.jvm.kt
actual class Storage {
    actual fun save(key: String, value: String) {
        require(key.isNotBlank()) { "key must not be blank" } // duplicated
        Preferences.userRoot().put(key, value)
    }
}

// iosMain/kotlin/Storage.ios.kt
actual class Storage {
    actual fun save(key: String, value: String) {
        require(key.isNotBlank()) { "key must not be blank" } // duplicated
        NSUserDefaults.standardUserDefaults.setObject(value, key)
    }
}
```

## Good

```kotlin
// commonMain: shared validation + shared interface, minimal expect surface
package com.example.storage

interface StoragePlatform {
    fun rawSave(key: String, value: String)
}

class Storage(private val platform: StoragePlatform) {
    fun save(key: String, value: String) {
        require(key.isNotBlank()) { "key must not be blank" } // written once
        platform.rawSave(key, value)
    }
}

// jvmMain: only the genuinely platform-specific bit
class JvmStoragePlatform : StoragePlatform {
    override fun rawSave(key: String, value: String) =
        Preferences.userRoot().put(key, value)
}

// iosMain: only the genuinely platform-specific bit
class IosStoragePlatform : StoragePlatform {
    override fun rawSave(key: String, value: String) =
        NSUserDefaults.standardUserDefaults.setObject(value, key)
}
```

## Intermediate Source Sets

```kotlin
// build.gradle.kts
kotlin {
    androidTarget()
    iosX64(); iosArm64(); iosSimulatorArm64()

    sourceSets {
        val commonMain by getting
        // Intermediate set shared by all iOS targets, avoiding
        // duplication across iosX64/iosArm64/iosSimulatorArm64
        val iosMain by creating { dependsOn(commonMain) }
        val iosX64Main by getting { dependsOn(iosMain) }
        val iosArm64Main by getting { dependsOn(iosMain) }
        val iosSimulatorArm64Main by getting { dependsOn(iosMain) }
    }
}
```

## See Also

- [`proj-gradle-multi-module`](proj-gradle-multi-module.md) - the module-level counterpart to source set splitting
- [`interop-platform-type-handling`](interop-platform-type-handling.md) - related concern when the platform boundary is JVM/Java rather than KMP
- [`api-visibility-internal`](api-visibility-internal.md) - keep `actual` implementations internal unless they need to be public
