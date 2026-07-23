# lint-detekt-baseline

> Run detekt with a committed baseline for legacy code

## Why It Matters

Turning on detekt for an existing codebase typically surfaces thousands of pre-existing issues, which makes teams either disable the tool entirely or drown the CI log in noise that hides new violations. A baseline snapshot freezes today's known issues so detekt only fails the build on *new* violations, letting you adopt strict linting immediately without a multi-week cleanup blocking it.

## Bad

```kotlin
// build.gradle.kts
detekt {
    config.setFrom("$rootDir/config/detekt.yml")
    // No baseline - first run reports 4,000 existing issues,
    // team disables detekt in CI a week later out of frustration
}
```

## Good

```kotlin
// build.gradle.kts
detekt {
    config.setFrom("$rootDir/config/detekt.yml")
    baseline = file("$rootDir/config/detekt-baseline.xml")
}

tasks.withType<io.gitlab.arturbosch.detekt.Detekt>().configureEach {
    baseline.set(file("$rootDir/config/detekt-baseline.xml"))
}
```

```bash
# Generate the baseline once, capturing all existing issues
./gradlew detektBaseline

# Commit config/detekt-baseline.xml
# From now on, CI only fails on violations NOT in the baseline
./gradlew detekt
```

## Shrinking the Baseline Over Time

Treat the baseline as debt, not a permanent exemption. Periodically delete a chunk of entries and fix the resulting failures, or add a scheduled CI job that reports baseline size as a tracked metric so it trends toward zero instead of silently growing.

## See Also

- [`lint-detekt-complexity-rules`](lint-detekt-complexity-rules.md) - the rules that generate most baseline entries initially
- [`lint-ci-lint-gate`](lint-ci-lint-gate.md) - wire the baselined detekt run into a required CI check
- [`lint-suppress-with-justification`](lint-suppress-with-justification.md) - the alternative to baselining for a single, deliberate exception
