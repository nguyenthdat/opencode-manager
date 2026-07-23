# meta-extension-module

> Package runtime extensions as extension modules

## Why It Matters

Extension modules provide a standard, declarative way to add methods to existing classes. Unlike `ExpandoMetaClass`, they're discovered via service-loader descriptors, work with `@CompileStatic`, and are versioned and packaged like any other dependency. They're the official mechanism for extending JDK/GDK classes.

## Bad

```groovy
// Ad-hoc global injection in a random script
Date.metaClass.format = { String pattern ->
    new java.text.SimpleDateFormat(pattern).format(delegate)
}

File.metaClass.eachLineReversed = { Closure c ->
    delegate.readLines().reverse().each(c)
}
```

## Good

```groovy
// src/main/groovy/com/example/extensions/DateExtensions.groovy
package com.example.extensions

class DateExtensions {
    static String format(Date self, String pattern) {
        new java.text.SimpleDateFormat(pattern).format(self)
    }

    static boolean isWeekend(Date self) {
        def cal = Calendar.instance
        cal.time = self
        cal.get(Calendar.DAY_OF_WEEK) in [Calendar.SATURDAY, Calendar.SUNDAY]
    }
}

// META-INF/services/org.codehaus.groovy.runtime.ExtensionModule
/*
moduleName = date-extensions
moduleVersion = 1.0
extensionClasses = com.example.extensions.DateExtensions
*/

// Usage — works everywhere after adding the jar to classpath
def date = new Date()
println date.format('yyyy-MM-dd')
println date.isWeekend()
```

## See Also

- [dsl-extension-modules](dsl-extension-modules.md) - Use extension modules for DSL
- [meta-no-global-metaClass](meta-no-global-metaClass.md) - Don't modify DefaultGroovyMethods globally
- [meta-category-class](meta-category-class.md) - Use @Category for scoped injection
