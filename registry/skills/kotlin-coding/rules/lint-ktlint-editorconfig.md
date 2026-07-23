# lint-ktlint-editorconfig

> Configure ktlint rules via `.editorconfig`, not scattered suppressions

## Why It Matters

Disabling a ktlint rule with inline `@Suppress` comments or per-file `.editorconfig` overrides scattered around the repo means the actual formatting policy is nowhere written down and different directories silently follow different rules. A single root `.editorconfig` is the one place ktlint (and most IDEs) look for style configuration, making the policy discoverable and consistent.

## Bad

```kotlin
// Some files have this at the top, others don't - inconsistent,
// and easy to miss when reviewing a new file
@file:Suppress("ktlint:standard:no-wildcard-imports")
package com.example.app

import com.example.app.model.*
```

## Good

```ini
# .editorconfig (repo root)
root = true

[*.{kt,kts}]
indent_size = 4
max_line_length = 120
insert_final_newline = true
ktlint_standard_no-wildcard-imports = disabled
ktlint_standard_filename = disabled
ktlint_function_signature_body_expression_wrapping = default
```

```kotlin
// No per-file suppression needed - the whole project follows the
// same documented policy, and IDEs pick it up automatically
package com.example.app

import com.example.app.model.Order
import com.example.app.model.Customer
```

## Scoping Rules to Specific Paths

```ini
# .editorconfig
[generated/**.kt]
ktlint = disabled  # skip generated code entirely, e.g. protobuf output
```

## See Also

- [`lint-ktlint-formatting`](lint-ktlint-formatting.md) - the ktlint setup this file configures
- [`lint-suppress-with-justification`](lint-suppress-with-justification.md) - contrast: `.editorconfig` for project policy, `@Suppress` + comment for one-off exceptions
- [`lint-ci-lint-gate`](lint-ci-lint-gate.md) - CI enforces the policy this file defines
