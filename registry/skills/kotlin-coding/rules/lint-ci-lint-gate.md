# lint-ci-lint-gate

> Run detekt/ktlint/compiler checks as a required CI gate

## Why It Matters

Lint tools that run only on developers' machines "when they remember to" catch nothing in practice — the whole point of static analysis is that it runs the same way every time, for every change. Making detekt, ktlint, and the compiler's warning checks a required, non-bypassable CI status check is what turns configured tooling into an actually-enforced policy.

## Bad

```yaml
# .github/workflows/ci.yml
jobs:
  build:
    steps:
      - run: ./gradlew build
      # detekt/ktlint exist in the project but nothing runs them in CI;
      # they only run if a developer remembers `./gradlew check` locally
```

## Good

```yaml
# .github/workflows/ci.yml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '21' }
      - run: ./gradlew ktlintCheck detekt build -Pci=true
```

```kotlin
// build.gradle.kts - `check` aggregates everything so `ci.yml` can
// call one task instead of listing each tool separately
tasks.check {
    dependsOn("ktlintCheck", "detekt")
}
```

```
# Branch protection settings (GitHub repo settings, not code):
# Require status checks to pass before merging: "lint" is required
# No admin bypass - even repo admins can't merge a failing PR
```

## Fail Fast, Fail Cheap

Run lint (seconds) before the full test suite (minutes) in the pipeline so a formatting violation fails in 30 seconds instead of after a 10-minute build, keeping feedback loops short.

## See Also

- [`lint-detekt-baseline`](lint-detekt-baseline.md) - lets an existing codebase adopt this gate without a big-bang cleanup
- [`lint-ktlint-formatting`](lint-ktlint-formatting.md) - one of the checks this gate runs
- [`lint-compiler-warnings-as-errors`](lint-compiler-warnings-as-errors.md) - the compiler-level check that belongs in the same gate
