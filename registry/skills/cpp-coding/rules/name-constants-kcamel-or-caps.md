# name-constants-kcamel-or-caps

> One consistent constant convention project-wide

## Why It Matters

Two conventions are common for compile-time constants: `kCamelCase` (Google style, distinguishes constants from both types and regular variables) and `SCREAMING_SNAKE_CASE` (matches C macro conventions, widely recognized). Either is fine; mixing both within one codebase makes it unclear at a glance whether an identifier is a constant, a macro, or something else.

## Bad — Mixed Conventions in One Codebase

```cpp
constexpr int MaxRetries = 3;         // PascalCase — collides visually with type names
constexpr int max_connections = 100;  // Looks like a variable, not a constant
constexpr double PI_VALUE = 3.14159;  // SCREAMING_SNAKE_CASE — inconsistent with the above two
```

## Good — Pick One, Apply Everywhere

```cpp
// Option A: kCamelCase (Google style)
constexpr int kMaxRetries = 3;
constexpr int kMaxConnections = 100;
constexpr double kPiValue = 3.14159;

// Option B: SCREAMING_SNAKE_CASE
constexpr int MAX_RETRIES = 3;
constexpr int MAX_CONNECTIONS = 100;
constexpr double PI_VALUE = 3.14159;
```

## Distinguish From Macros

```cpp
// Reserve true ALL_CAPS for macros specifically if using kCamelCase for
// constants — this keeps "this is textual substitution, be careful" visually
// distinct from "this is a type-checked, scoped constant":
#define LEGACY_BUFFER_SIZE 256   // Macro: needs care, no type-checking

constexpr int kBufferSize = 256;  // Constant: type-checked, scoped, preferred
```

## See Also

- [name-macros-all-caps](name-macros-all-caps.md) - Reserving ALL_CAPS specifically for macros
- [anti-macro-for-constants](anti-macro-for-constants.md) - Preferring `constexpr` over `#define` for constants
- [api-default-member-init](api-default-member-init.md) - Default values that often reference these constants
