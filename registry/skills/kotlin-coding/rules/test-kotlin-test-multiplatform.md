# test-kotlin-test-multiplatform

> Use `kotlin.test` for common, multiplatform-portable test code

## Why It Matters

Test code written against JUnit or Kotest APIs directly in a `commonMain`/`commonTest` source set won't compile for non-JVM targets (JS, Native, Wasm), forcing you to duplicate tests per platform. `kotlin.test` is a thin multiplatform facade that maps to the right underlying framework (JUnit on JVM, its own runner on JS/Native) so the same test source compiles and runs everywhere.

## Bad

```kotlin
// commonTest/kotlin/MathTest.kt — breaks the JS/Native targets
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.assertEquals

class MathTest {
    @Test
    fun `addition is commutative`() {
        assertEquals(5, 2 + 3)
    }
}
```

## Good

```kotlin
// commonTest/kotlin/MathTest.kt — compiles on every KMP target
import kotlin.test.Test
import kotlin.test.assertEquals

class MathTest {
    @Test
    fun `addition is commutative`() {
        assertEquals(5, 2 + 3)
    }
}
```

## Gradle Setup

```kotlin
// build.gradle.kts
kotlin {
    sourceSets {
        commonTest.dependencies {
            implementation(kotlin("test"))
        }
        jvmTest.dependencies {
            implementation(kotlin("test-junit5")) // wires kotlin.test onto JUnit 5 on the JVM target
        }
    }
}
```

The `kotlin-test-junit5` (or `-junit`, `-testng`) artifact is what actually executes `kotlin.test.Test` annotations under JUnit on the JVM; other targets bring their own runner transparently.

## Platform-Specific Escape Hatch

```kotlin
// jvmTest/kotlin/JvmOnlyTest.kt — fine to use JUnit-specific features here
import org.junit.jupiter.api.Assertions.assertThrows

class JvmOnlyTest {
    @org.junit.jupiter.api.Test
    fun `jvm-specific behavior`() {
        assertThrows(IllegalStateException::class.java) { /* ... */ }
    }
}
```

Reach for full JUnit 5 or Kotest features only in platform-specific source sets (`jvmTest`) where portability isn't a concern.

## See Also

- [`test-junit5-annotations`](test-junit5-annotations.md) - JVM-only testing once portability isn't required
- [`test-kotest-specs`](test-kotest-specs.md) - a richer JVM-only alternative to `kotlin.test`
- [`proj-source-set-organization`](proj-source-set-organization.md) - how commonTest/jvmTest source sets are organized
