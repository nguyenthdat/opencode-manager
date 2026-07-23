# meta-no-global-metaClass

> Don't modify `DefaultGroovyMethods` globally

## Why It Matters

Adding methods to `String.metaClass`, `List.metaClass`, or other global metaclasses affects ALL instances across the entire JVM, including libraries and frameworks. This causes unpredictable behavior, conflicts, and debugging nightmares. Use `@Category`, extension modules, or traits instead.

## Bad

```groovy
// Global injection — affects every String in the JVM
String.metaClass.isEmail = { ->
    delegate.contains('@')
}

// Now even library code has a weird isEmail property
println 'hello'.isEmail      // All strings have this

// Conflicts with other libraries
Integer.metaClass.days = { ->
    delegate * 24 * 60 * 60 * 1000
}

// Mysteriously, Jenkins or Gradle strings also have these methods
// Hard to debug when things break
```

## Good

```groovy
// Extension module (preferred — type-safe, documented, controllable)
// META-INF/services/org.codehaus.groovy.runtime.ExtensionModule
class StringExtensions {
    static boolean isEmail(String self) {
        self.contains('@')
    }
}

// Or: Category (scoped)
@Category(String)
class StringValidation {
    boolean isEmail() { this.contains('@') }
    boolean isUrl() { this.startsWith('http') }
}

use(StringValidation) {
    println 'hello@example.com'.isEmail()  // Only in this scope
}

// Or: just write a utility class
class StringValidators {
    static boolean isEmail(String s) { s.contains('@') }
    static boolean isUrl(String s) { s.startsWith('http') }
}
```

## See Also

- [meta-category-class](meta-category-class.md) - Use @Category for scoped injection
- [meta-extension-module](meta-extension-module.md) - Package runtime extensions as modules
- [anti-runtime-meta-hot](anti-runtime-meta-hot.md) - Don't use metaprogramming in hot paths
