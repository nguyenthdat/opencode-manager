# doc-readme-module

> Maintain a README per module with purpose and usage

## Why It Matters

A Gradle multi-module project's `settings.gradle.kts` file lists dozens of modules by name alone (`:core`, `:payments`, `:networking-http`) — nothing there tells a new contributor what each module does, whether it's safe to depend on, or how to use its public API without opening every source file. A per-module README answers "should I use this, and how?" before someone has to read code to find out.

## Bad

```
payments/
  build.gradle.kts
  src/main/kotlin/...
  (no README — purpose, dependencies, and usage are undocumented)
```

## Good

```markdown
<!-- payments/README.md -->
# :payments

Charges, refunds, and reconciliation against the Stripe API.

## Depends On
- `:core` (money types, `Result` helpers)
- `:networking-http` (the shared HTTP client)

## Usage

\`\`\`kotlin
val gateway = StripePaymentGateway(apiKey = config.stripeApiKey)
val result = gateway.charge(amountCents = 1999, customerId = "cus_123")
\`\`\`

## Ownership
Owned by the Payments team (#payments-eng on Slack). File issues under the `payments` label.
```

## What a Module README Should Cover

A useful module README stays short and covers four things: what the module is for, what it depends on (and what depends on it), a minimal usage snippet, and who owns it — anything longer (full API reference, design rationale) belongs in KDoc/Dokka or an ADR instead, linked from the README rather than duplicated into it.

## Keeping It From Going Stale

```markdown
## Usage

See [`@sample`-linked examples in the generated API docs](https://docs.example.com/payments)
for up-to-date usage; the snippet below is illustrative only.
```

Linking to Dokka-generated (and therefore compiler-checked) samples instead of hand-written code blocks keeps the README's examples from silently rotting as the API evolves.

## See Also

- [`doc-module-package-docs`](doc-module-package-docs.md) - Dokka's `Module.md` as the docs-site equivalent of this README
- [`doc-kdoc-sample-tag`](doc-kdoc-sample-tag.md) - compiled samples to link from the README instead of stale snippets
- [`proj-gradle-multi-module`](proj-gradle-multi-module.md) - the module structure each README documents
