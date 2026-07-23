# lint-ktlint-formatting

> Enforce formatting with ktlint so style reviews stay off PRs

## Why It Matters

Without an automated formatter, code review time gets spent debating brace placement, import order, and trailing commas instead of logic and design, and diffs get noisy with unrelated whitespace changes. ktlint applies the (mostly) unconfigurable official Kotlin style automatically, so formatting stops being a topic of human discussion.

## Bad

```kotlin
// PR review comment #1: "extra blank line here"
// PR review comment #2: "wrong import order"
// PR review comment #3: "should be 4 spaces not 2"
fun greet(name:String){
    val message ="Hello, $name!"
  println(message)
}
```

## Good

```kotlin
// build.gradle.kts
plugins {
    id("org.jlleitschuh.gradle.ktlint") version "12.1.0"
}

ktlint {
    version.set("1.3.1")
    android.set(false)
    outputToConsole.set(true)
}
```

```bash
# Check formatting - what CI runs
./gradlew ktlintCheck

# Auto-fix formatting - what a pre-commit hook or developer runs locally
./gradlew ktlintFormat
```

```kotlin
// After ktlintFormat - consistent, unopinionated, nobody argues about it
fun greet(name: String) {
    val message = "Hello, $name!"
    println(message)
}
```

## Pre-Commit Hook

```bash
# .git/hooks/pre-commit (or via a tool like lefthook)
./gradlew ktlintFormat
git add -u
```

## See Also

- [`lint-ktlint-editorconfig`](lint-ktlint-editorconfig.md) - configure the handful of rules ktlint does allow tuning
- [`lint-ci-lint-gate`](lint-ci-lint-gate.md) - make `ktlintCheck` a required CI check, not just a local habit
- [`lint-compiler-warnings-as-errors`](lint-compiler-warnings-as-errors.md) - pairs with ktlint to keep both style and correctness enforced
