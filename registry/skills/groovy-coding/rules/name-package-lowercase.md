# name-package-lowercase

> Lowercase package names with reverse domain

## Why It Matters

Java package naming convention uses lowercase, dot-separated reverse-domain identifiers. Groovy follows this convention. Uppercase or camelCase packages cause issues with some build tools, confuse IDE indexing, and violate the universal JVM packaging standard.

## Bad

```groovy
package com.Example.Utils          // PascalCase
package com.example.UserService    // PascalCase
package UTILS                      // All caps
package com_example_utils          // snake_case
```

## Good

```groovy
package com.example.utils
package com.example.user.service
package com.company.product.module

// Multi-module
package com.example.core.domain
package com.example.core.service
package com.example.core.repository
```

## See Also

- [name-classes-PascalCase](name-classes-PascalCase.md) - Use PascalCase for classes
- [name-script-vs-class](name-script-vs-class.md) - Script files vs class files
- [proj-package-by-feature](proj-package-by-feature.md) - Package by feature
