# name-file-name-match-class

> Match file name to primary type name

## Why It Matters

When a header or source file's name directly corresponds to the primary class or type it defines (using the same casing convention, typically `snake_case` for the filename even if the type is `PascalCase`), navigating a codebase by "which file defines `X`?" becomes trivial, without needing an IDE's symbol search.

## Bad

```
# File contains class HttpRequestHandler, but is named:
network_stuff.hpp
utils2.cpp
helpers.hpp   # Contains three unrelated classes with no obvious connection to the name
```

## Good

```
# File names map directly and predictably to their primary type
http_request_handler.hpp   → class HttpRequestHandler
http_request_handler.cpp
connection_pool.hpp        → class ConnectionPool
connection_pool.cpp
```

## One Primary Type per File (With Small, Closely-Related Exceptions)

```cpp
// connection_pool.hpp
class ConnectionPool {
    // ...
};

// A small, tightly-coupled helper type used only by ConnectionPool may live
// in the same file if it has no independent meaning outside this context:
struct ConnectionPoolStats {
    size_t active;
    size_t idle;
};
```

## See Also

- [proj-header-source-split](proj-header-source-split.md) - Header/source pairing conventions
- [proj-separate-public-private-headers](proj-separate-public-private-headers.md) - Directory layout for headers
- [name-types-pascal](name-types-pascal.md) - The type-naming convention files should mirror
