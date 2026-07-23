# name-no-underscore-vars

> No leading underscores for private (Groovy convention)

## Why It Matters

Unlike Python or JavaScript, Groovy/Java don't use underscore prefixes for private fields. Groovy classes use property syntax where fields are accessible through auto-generated getters. Leading underscores break this convention and suggest a different language's idiom.

## Bad

```groovy
class UserService {
    private UserRepository _userRepository    // Python/Ruby style
    private String _apiKey

    def _internalHelper() { }                 // Private method with underscore
}
```

## Good

```groovy
class UserService {
    private UserRepository userRepository     // Standard Java/Groovy naming
    private String apiKey

    private def internalHelper() { }          // private keyword is sufficient

    // Or use @PackageScope for package-private
    @PackageScope
    def packageHelper() { }
}
```

## Groovy Property Visibility

```groovy
class Service {
    String publicProperty        // Public by default (getter/setter auto-generated)
    private String secret        // Private field — no getter
    protected String shared      // Visible to subclasses

    // No underscore needed — access modifiers are clear
    def doWork() {
        println secret   // Direct field access within class
    }
}
```

## See Also

- [name-methods-camelCase](name-methods-camelCase.md) - Use camelCase for methods
- [name-classes-PascalCase](name-classes-PascalCase.md) - Use PascalCase for classes
- [proj-package-by-feature](proj-package-by-feature.md) - Package by feature
