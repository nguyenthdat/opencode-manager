# dsl-extension-modules

> Use extension modules for type-safe DSL additions

## Why It Matters

Extension modules add methods to existing classes at compile time, enabling type-safe DSLs without runtime metaprogramming. Unlike categories or ExpandoMetaClass, extension modules are discovered via service descriptors, work with `@CompileStatic`, and provide IDE autocompletion.

## Bad

```groovy
// Global metaprogramming — fragile, not type-safe
String.metaClass.shout = { ->
    delegate.toUpperCase() + '!!!'
}

// No IDE support, no compile-time checking
println 'hello'.shout()
```

## Good

```groovy
// Extension module class
package com.example.extensions

class StringExtensions {
    static String shout(String self) {
        self.toUpperCase() + '!!!'
    }

    static String truncate(String self, int maxLen) {
        self.size() <= maxLen ? self : self[0..<maxLen] + '...'
    }

    static boolean isBlank(String self) {
        self == null || self.trim().empty
    }
}

// META-INF/services/org.codehaus.groovy.runtime.ExtensionModule
// moduleName = string-extensions
// moduleVersion = 1.0
// extensionClasses = com.example.extensions.StringExtensions
```

## See Also

- [meta-extension-module](meta-extension-module.md) - Package runtime extensions as modules
- [meta-no-global-metaClass](meta-no-global-metaClass.md) - Don't modify DefaultGroovyMethods globally
- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for performance
