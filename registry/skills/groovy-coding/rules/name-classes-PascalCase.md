# name-classes-PascalCase

> Use `PascalCase` for classes and traits

## Why It Matters

`PascalCase` (upper camel case) for class and trait names is the universal Groovy/Java convention. Deviating from it confuses developers, breaks IDE expectations, and violates the principle of least surprise. Every Groovy and Java developer expects class names to start with an uppercase letter.

## Bad

```groovy
class user_service { }          // snake_case
class userService { }           // camelCase — reserved for methods
class userservice { }           // lowercase
trait serializable { }          // not PascalCase
```

## Good

```groovy
class UserService { }
class OrderProcessor { }
class HTTPClient { }            // Acronyms stay uppercase
class URLParser { }
trait Serializable { }
trait Auditable { }

// Scripts are the exception — they're lowercase
// deployApp.groovy, runMigration.groovy
```

## See Also

- [name-methods-camelCase](name-methods-camelCase.md) - Use camelCase for methods
- [name-constants-UPPER_SNAKE](name-constants-UPPER_SNAKE.md) - UPPER_SNAKE_CASE for constants
- [name-package-lowercase](name-package-lowercase.md) - Lowercase package names
