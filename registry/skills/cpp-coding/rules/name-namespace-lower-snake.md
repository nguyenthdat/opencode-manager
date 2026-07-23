# name-namespace-lower-snake

> Short `lower_snake_case` namespaces

## Why It Matters

Namespaces are typed constantly (either explicitly or implied by `using`), so short, lowercase names reduce visual noise, and consistency with the rest of the lowercase-function/variable convention keeps namespace names from being confused with type names.

## Bad

```cpp
namespace MyCompanyGraphicsEngine {   // Long, PascalCase, looks like a type
namespace Rendering_Utilities {        // Inconsistent casing within the same hierarchy
    class Shader { /* ... */ };
}
}
```

## Good

```cpp
namespace gfx {
namespace render {
    class Shader { /* ... */ };
}
}

// Or with C++17 nested namespace syntax:
namespace gfx::render {
    class Shader { /* ... */ };
}
```

## Detail/Internal Namespaces

```cpp
namespace gfx {
    void public_api();

    namespace detail {   // Convention: `detail` marks implementation-only code,
        void helper();    // not part of the public API, even though technically visible
    }
}
```

## See Also

- [name-functions-lower-snake](name-functions-lower-snake.md) - The general lowercase convention this matches
- [proj-namespace-per-library](proj-namespace-per-library.md) - Using namespaces to avoid symbol clashes
- [proj-pub-use-reexport](proj-cmake-target-based.md) - Structuring public API surface across namespaces
