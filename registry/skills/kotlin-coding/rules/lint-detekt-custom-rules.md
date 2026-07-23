# lint-detekt-custom-rules

> Write custom detekt rules for project-specific conventions

## Why It Matters

Detekt's built-in rules cover general Kotlin style, but they can't know that your team forbids constructing `OkHttpClient` outside a DI module, or that all repository classes must implement a naming suffix convention. Custom detekt rules let you encode project-specific architectural conventions as automated, CI-enforced checks instead of relying on reviewers to remember and catch them by eye every time.

## Bad

```kotlin
// PR review comment, repeated every few weeks:
// "please inject OkHttpClient instead of constructing it here"
class UserRepository {
    private val client = OkHttpClient() // should come from DI
}
// Nothing but a reviewer's memory prevents this from recurring
```

## Good

```kotlin
// detekt-rules/src/main/kotlin/NoDirectOkHttpClientConstruction.kt
package com.example.detekt.rules

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.KtCallExpression

class NoDirectOkHttpClientConstruction(config: Config) : Rule(config) {
    override val issue = Issue(
        "NoDirectOkHttpClientConstruction",
        Severity.Defect,
        "OkHttpClient must be obtained via dependency injection, not constructed directly.",
        Debt.TEN_MINS,
    )

    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        if (expression.calleeExpression?.text == "OkHttpClient") {
            report(CodeSmell(issue, Entity.from(expression), issue.description))
        }
    }
}
```

```kotlin
// build.gradle.kts (root or a module)
dependencies {
    detektPlugins(project(":detekt-rules"))
}
```

```yaml
# config/detekt.yml
CustomRules:
  NoDirectOkHttpClientConstruction:
    active: true
```

## Testing the Rule

```kotlin
class NoDirectOkHttpClientConstructionTest {
    @Test
    fun `flags direct construction`() {
        val findings = NoDirectOkHttpClientConstruction(Config.empty)
            .compileAndLint("val client = OkHttpClient()")
        assertThat(findings).hasSize(1)
    }
}
```

## See Also

- [`lint-detekt-complexity-rules`](lint-detekt-complexity-rules.md) - built-in rules this complements rather than replaces
- [`lint-ci-lint-gate`](lint-ci-lint-gate.md) - custom rules run as part of the same `detekt` task in CI
- [`test-junit5-annotations`](test-junit5-annotations.md) - custom rules are tested the same way as any other JVM code
