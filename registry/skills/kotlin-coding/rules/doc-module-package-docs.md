# doc-module-package-docs

> Document modules/packages with a `Module.md`/package-info summary

## Why It Matters

Per-declaration KDoc explains individual classes and functions, but says nothing about how a package's pieces fit together or what a whole Gradle module is responsible for — that context has to live somewhere a new contributor will actually find it before diving into individual files. Dokka's `Module.md`/`Package.md` convention gives that overview a fixed, tool-recognized home that renders as the landing page for each module/package in generated docs.

## Bad

```
:payments
  src/main/kotlin/com/example/payments/
    PaymentGateway.kt
    Charge.kt
    Refund.kt
    (no overview anywhere of what "payments" as a module is for)
```

## Good

```
:payments
  Module.md
  src/main/kotlin/com/example/payments/
    Package.md
    PaymentGateway.kt
    Charge.kt
    Refund.kt
```

```markdown
<!-- Module.md -->
# Module payments

Handles charging, refunding, and reconciling payments against the Stripe API.

Does not handle invoicing or tax calculation — see the `:billing` module for those.
```

```markdown
<!-- Package.md -->
# Package com.example.payments

Core types for issuing and tracking [Charge]s and [Refund]s through [PaymentGateway].
```

## Wiring Module.md into Dokka

```kotlin
// build.gradle.kts
tasks.dokkaHtml {
    dokkaSourceSets.configureEach {
        includes.from("Module.md")
    }
}
```

## What Belongs at the Module Level vs. KDoc

Keep `Module.md` focused on cross-cutting concerns a single class's KDoc can't express: what the module is responsible for, what it deliberately excludes, and how it relates to sibling modules — leave per-type behavior documentation to KDoc on the types themselves.

## See Also

- [`doc-dokka-generation`](doc-dokka-generation.md) - the tool that renders `Module.md`/`Package.md` into docs
- [`doc-readme-module`](doc-readme-module.md) - a human-facing README covering similar ground for contributors
- [`proj-gradle-multi-module`](proj-gradle-multi-module.md) - the module boundaries this documentation describes
