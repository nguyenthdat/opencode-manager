# meta-category-class

> Use `@Category` for temporary method injection

## Why It Matters

`@Category` provides scoped method injection — new methods are only available within a `use {}` block. This is safer than global `ExpandoMetaClass` modification because the injected methods don't leak outside the intended scope.

## Bad

```groovy
// Global injection — affects ALL Strings everywhere
String.metaClass.reverse = { -> delegate.reverse() }
String.metaClass.shout = { -> delegate.toUpperCase() + '!!!' }

// Now every String in the JVM has these methods
println 'hello'.reverse()
println 'world'.shout()

// Hard to track: which methods were added where?
```

## Good

```groovy
@Category(String)
class StringExtensions {
    String reverse() { this.reverse() }
    String shout() { this.toUpperCase() + '!!!' }
    String truncate(int maxLen) {
        this.size() <= maxLen ? this : this[0..<maxLen] + '...'
    }
}

use(StringExtensions) {
    println 'hello'.reverse()    // Only available in this block
    println 'world'.shout()
}

println 'hello'.shout()   // Method not available — compile error

// Multiple categories
use(StringExtensions, NumberExtensions) {
    println 'hello'.shout()
    println 100.formatCurrency('USD')
}
```

## See Also

- [meta-no-global-metaClass](meta-no-global-metaClass.md) - Don't modify DefaultGroovyMethods globally
- [meta-extension-module](meta-extension-module.md) - Package runtime extensions as modules
- [dsl-extension-modules](dsl-extension-modules.md) - Use extension modules for DSL additions
