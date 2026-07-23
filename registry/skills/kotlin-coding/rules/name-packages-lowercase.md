# name-packages-lowercase

> Use all-lowercase, dot-separated package names

## Why It Matters

Package names map directly to directory paths and JVM binary names, and the JVM/Kotlin spec effectively requires them to be lowercase to avoid case-sensitivity conflicts across filesystems (macOS/Windows are case-insensitive by default, Linux is not). Mixed-case or underscored packages cause "class not found" errors that only show up on certain operating systems or CI runners.

## Bad

```kotlin
package com.example.UserManagement

package com.example.user_management.data_sources

package com.example.userManagement.API
```

## Good

```kotlin
package com.example.usermanagement

package com.example.usermanagement.datasources

package com.example.usermanagement.api
```

## Multi-Word Segments

```kotlin
// Prefer collapsing multi-word segments rather than using delimiters
package com.example.paymentprocessing

// If a segment must stay distinct, nest another lowercase directory
package com.example.payment.processing
```

Kotlin (like Java) reserves underscores and hyphens as awkward in package segments since they're rarely valid across all build tooling; the convention is to just concatenate words in lowercase rather than delimit them.

## Ktlint/Detekt Rule

`detekt`'s `naming.PackageNaming` enforces the pattern `[a-z]+(\.[a-z][a-z0-9]*)*` by default:

```yaml
naming:
  PackageNaming:
    packagePattern: '[a-z]+(\.[a-z][a-z0-9]*)*'
```

## See Also

- [`name-classes-pascal`](name-classes-pascal.md) - casing for the types living inside the package
- [`proj-package-by-feature`](proj-package-by-feature.md) - how to structure package segments by feature
- [`proj-source-set-organization`](proj-source-set-organization.md) - how packages map to Gradle source sets
