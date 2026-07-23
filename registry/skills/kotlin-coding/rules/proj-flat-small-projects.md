# proj-flat-small-projects

> Keep small projects flat instead of over-modularizing prematurely

## Why It Matters

Splitting a 5,000-line app into a dozen Gradle modules before there's a real reason (separate teams, independent release cadence, genuinely reusable code) adds build configuration overhead, slows down Gradle sync, and forces you to guess boundaries before the domain is well understood — boundaries you'll likely get wrong and have to undo. A flat, well-packaged single module is easier to refactor than a wrongly-modularized multi-module project.

## Bad

```kotlin
// A weekend-project todo app split into 9 modules on day one
// settings.gradle.kts
include(
    ":app", ":core:ui", ":core:network", ":core:database",
    ":core:analytics", ":feature:list", ":feature:detail",
    ":feature:settings", ":feature:sync",
)
// Every module has boilerplate build.gradle.kts, and half of them
// have one file in them
```

## Good

```kotlin
// settings.gradle.kts
rootProject.name = "todo-app"
include(":app")

// Boundaries expressed with packages instead (see proj-package-by-feature)
// com/example/todo/list/
// com/example/todo/detail/
// com/example/todo/settings/
// com/example/todo/sync/
// com/example/todo/core/  (Database, NetworkClient, shared types)
```

## When to Actually Split

Split out a module when at least one of these is true, not preemptively:

- The code is reused by a second app or a CLI/server counterpart.
- A team boundary needs a build-enforced ownership boundary.
- Build time profiling (`--profile`) shows one package recompiling too much of the graph.
- You need `explicitApi()` or a stricter dependency policy for just that code.

## See Also

- [`proj-gradle-multi-module`](proj-gradle-multi-module.md) - the split to reach for once one of the triggers above is true
- [`proj-package-by-feature`](proj-package-by-feature.md) - get the seams right at the package level first
- [`anti-god-object`](anti-god-object.md) - flat doesn't mean unstructured; still avoid dumping-ground classes
