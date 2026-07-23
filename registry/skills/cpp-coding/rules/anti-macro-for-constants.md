# anti-macro-for-constants

> Don't use `#define` for constants

## Why It Matters

A `#define`d constant has no type, no scope, and doesn't appear in a debugger's symbol table — it's textually substituted before the compiler ever sees it, so it can't be namespaced, can collide with any identically-named macro anywhere in the program, and produces confusing error messages when misused.

## Bad

```cpp
#define MAX_RETRIES 3          // No type, no scope, visible to the entire program
#define PI 3.14159               // Could silently collide with an unrelated macro
                                   // named PI defined by a third-party header
```

## Good

```cpp
constexpr int kMaxRetries = 3;    // Typed, scoped, visible in the debugger
constexpr double kPi = 3.14159;    // Namespaced if declared inside a namespace
```

## See Also

- [name-macros-all-caps](name-macros-all-caps.md) - Reserving macros for genuine textual-substitution needs
- [name-constants-kcamel-or-caps](name-constants-kcamel-or-caps.md) - Consistent naming for real constants
- [anti-macro-for-functions](anti-macro-for-functions.md) - The analogous anti-pattern for function-like macros
