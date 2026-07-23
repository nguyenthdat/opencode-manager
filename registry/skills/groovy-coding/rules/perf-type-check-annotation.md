# perf-type-check-annotation

> Use `@TypeChecked` for early error detection

## Why It Matters

`@TypeChecked` performs static type checking without the full compilation of `@CompileStatic`. It catches type mismatches, missing methods, and incorrect property access at compile time while preserving dynamic dispatch. It's a good middle ground for code that needs Groovy's dynamic features but wants type safety.

## Bad

```groovy
class UserService {
    def getNameLength(user) {        // No types — any mistake goes undetected
        user.name.lengh()             // Typo: lengh instead of length
    }
}
// Compiles fine, fails at runtime with MissingMethodException
```

## Good

```groovy
@groovy.transform.TypeChecked
class UserService {
    int getNameLength(User user) {
        user.name.length()            // Compile error if User has no 'name'
    }
}

// Error detected at compile time:
// "Cannot find matching method java.lang.String#lengh()"

// @TypeChecked vs @CompileStatic
@groovy.transform.TypeChecked
class DynamicService {
    List<String> process(List<String> items) {
        items.findAll { it.length() > 3 }   // Type-checked, still dynamic dispatch
    }
}
```

## See Also

- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for production
- [perf-no-runtime-meta](perf-no-runtime-meta.md) - Avoid runtime metaprogramming in hot paths
- [closure-type-check](closure-type-check.md) - Use @ClosureParams for IDE support
