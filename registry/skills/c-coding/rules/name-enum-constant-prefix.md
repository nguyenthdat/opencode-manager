# name-enum-constant-prefix

> Prefix every enumerator with the enum's own name so its origin and intent are clear wherever it's used, since C enum constants share the global namespace

## Why It Matters

Unlike some languages, C enumerator names live directly in the enclosing scope's namespace (not inside a scoped `EnumName::` qualifier) and are visible project-wide once the header is included. Two enums with unqualified members like `OK`/`ERROR` will collide with each other, and a bare enumerator gives no hint of which enum it belongs to when read out of context (e.g., in a log message or a `switch` far from the definition).

## Bad

```c
typedef enum { OK, NOT_FOUND, TIMEOUT } http_status;
typedef enum { OK, FAILED } db_status;   /* redeclaration of OK: compile error */
```

## Good

```c
typedef enum {
    HTTP_OK,
    HTTP_NOT_FOUND,
    HTTP_TIMEOUT,
} http_status;

typedef enum {
    DB_OK,
    DB_FAILED,
} db_status;

http_status s = HTTP_NOT_FOUND;   /* unambiguous in isolation, e.g. in a log line */
```

## Explicit Values When the Enum Represents a Wire Format or ABI

```c
typedef enum {
    PACKET_TYPE_PING = 1,
    PACKET_TYPE_PONG = 2,
    PACKET_TYPE_DATA = 3,
} packet_type;   /* explicit values: safe to serialize, won't shift if a member is inserted later */
```

## See Also

- [type-enum-for-closed-sets](type-enum-for-closed-sets.md) - Broader guidance on using enums well
- [api-consistent-prefix-naming](api-consistent-prefix-naming.md) - The same collision-avoidance principle applied to functions/types
- [err-error-enum-not-magic-int](err-error-enum-not-magic-int.md) - A common use case for prefixed enums
