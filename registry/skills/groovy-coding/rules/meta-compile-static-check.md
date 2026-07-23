# meta-compile-static-check

> Use `@CompileStatic` for production code with meta

## Why It Matters

Runtime metaprogramming and `@CompileStatic` don't mix — static compilation can't see dynamically added methods. For production code, prefer compile-time constructs (traits, `@Delegate`, extension modules) that work with static compilation, giving you both safety and performance.

## Bad

```groovy
@groovy.transform.CompileStatic
class Service {
    def process(String input) {
        // CompileStatic can't resolve dynamically added methods
        input.someDynamicMethod()     // Compile error under @CompileStatic
    }
}

// Global metaClass modification
String.metaClass.shout = { -> toUpperCase() + '!!!' }

@groovy.transform.CompileStatic
class User {
    String name
    String getShoutName() {
        name.shout()   // Compile error: cannot find matching method
    }
}
```

## Good

```groovy
// Use extension modules (discovered at compile time)
@groovy.transform.CompileStatic
class Service {
    def process(String input) {
        input.shout()     // Works if shout() is in an extension module
    }
}

// Or use traits with @CompileStatic
@groovy.transform.CompileStatic
class User {
    String name

    String getShoutName() {
        StringUtils.shout(name)     // Static utility method — always safe
    }
}

// Or explicit utility class
class StringUtils {
    static String shout(String s) {
        s.toUpperCase() + '!!!'
    }
}
```

## See Also

- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for production
- [meta-extension-module](meta-extension-module.md) - Package runtime extensions as modules
- [perf-no-runtime-meta](perf-no-runtime-meta.md) - Avoid runtime metaprogramming in hot paths
