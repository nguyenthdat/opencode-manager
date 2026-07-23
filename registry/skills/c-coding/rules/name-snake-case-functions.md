# name-snake-case-functions

> Use `lower_snake_case` for function and variable names, matching the convention used by the C standard library and most C codebases

## Why It Matters

Consistent casing across a codebase (and with the standard library it inherits from — `malloc`, `strcpy`, `printf`) reduces cognitive overhead: readers can predict naming style instead of re-learning it per file, and mixed conventions (`camelCase` here, `snake_case` there) make grep/search harder and signal inconsistent authorship.

## Bad

```c
int ComputeChecksum(const char *Data, size_t DataLen);   /* PascalCase, unlike stdlib */
int computeChecksum2(const char *data, size_t dataLen);   /* camelCase, also inconsistent */
```

## Good

```c
int compute_checksum(const char *data, size_t data_len);

int retry_count = 0;
struct connection *active_conn = NULL;
```

## Where PascalCase/camelCase Sometimes Appear Legitimately in C

Some codebases (Windows API-adjacent code, certain embedded SDKs) use `PascalCase` for types or `camelCase` throughout, matching a platform convention. Pick the prevailing convention of the project/platform you're contributing to, and apply it consistently rather than mixing styles within one file.

## See Also

- [name-boolean-is-has-prefix](name-boolean-is-has-prefix.md) - Naming convention specifically for boolean-returning functions
- [name-verb-noun-function-names](name-verb-noun-function-names.md) - Structuring the function name itself
- [name-struct-typedef-convention](name-struct-typedef-convention.md) - The corresponding convention for types
