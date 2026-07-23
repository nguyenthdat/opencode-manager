# name-macros-all-caps

> `ALL_CAPS` only for macros

## Why It Matters

Macros are textual substitution with no scoping, no type-checking, and no namespace — they can collide with any identifier anywhere in the translation unit. Reserving `ALL_CAPS` naming exclusively for macros (never for constants, functions, or types) means any `ALL_CAPS` identifier immediately signals "this is a macro; check for these hazards" to the reader.

## Bad

```cpp
#define MAX_SIZE 256          // OK: this is genuinely a macro
constexpr int MAX_RETRIES = 3; // Confusing: looks like a macro but is a real,
                                 // type-checked, scoped constant — ALL_CAPS
                                 // convention is now ambiguous in this codebase
```

## Good

```cpp
#define MAX_SIZE 256           // ALL_CAPS reserved for genuine macros only

constexpr int kMaxRetries = 3;  // Non-macro constants use a distinct convention
                                  // (kCamelCase or a different casing entirely)
```

## Prefer Avoiding the Macro Entirely When Possible

```cpp
// Most "constant" macros should just be constexpr, which is scoped,
// type-checked, and doesn't collide with unrelated identifiers:
// #define MAX_SIZE 256           // Avoid when possible
constexpr int kMaxSize = 256;      // Preferred
```

## Legitimate, Unavoidable Macro Uses

```cpp
#define STRINGIFY(x) #x                 // Preprocessor-only operation
#define DEBUG_LOG(msg) /* conditional compilation, __FILE__/__LINE__ */
#ifdef _WIN32
#define PLATFORM_SEPARATOR '\\'
#else
#define PLATFORM_SEPARATOR '/'
#endif
```

## See Also

- [anti-macro-for-constants](anti-macro-for-constants.md) - Why to avoid macros for constants specifically
- [anti-macro-for-functions](anti-macro-for-functions.md) - Why to avoid macros for functions specifically
- [name-constants-kcamel-or-caps](name-constants-kcamel-or-caps.md) - The distinct convention for real constants
