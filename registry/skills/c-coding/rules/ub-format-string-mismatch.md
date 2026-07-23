# ub-format-string-mismatch

> Every `printf`/`scanf`-family format specifier must exactly match the type of its corresponding argument

## Why It Matters

`printf` and `scanf` are variadic; the compiler cannot verify at the call site that a `%d` corresponds to an `int` argument and a `%s` to a `char *`. A mismatch causes the function to read the wrong number of bytes off the variadic argument list (or interpret bytes as the wrong type), which is undefined behavior — commonly a crash, but in the case of an attacker-controlled format string, a serious vulnerability.

## Bad

```c
long user_id = get_user_id();
printf("id: %d\n", user_id);        /* %d expects int, argument is long: UB on LP64 */

size_t len = strlen(s);
printf("len: %d\n", len);             /* size_t is usually unsigned long/long: mismatch */

char name[32];
scanf("%s", name);                     /* no width limit: also a buffer overflow risk */

printf(user_supplied_string);          /* format string from untrusted input: %n/%s can crash or leak memory */
```

## Good

```c
long user_id = get_user_id();
printf("id: %ld\n", user_id);          /* %ld matches long */

size_t len = strlen(s);
printf("len: %zu\n", len);              /* %zu matches size_t exactly, per C99 */

char name[32];
scanf("%31s", name);                     /* width limit leaves room for the null terminator */

printf("%s", user_supplied_string);       /* never pass untrusted data as the format string itself */
```

## Fixed-Width Types Need Their Own Macros

```c
#include <inttypes.h>
int32_t code = get_code();
printf("code: %" PRId32 "\n", code);     /* portable across platforms where int32_t's underlying type varies */

uint64_t id = get_id();
printf("id: %" PRIu64 "\n", id);
```

## Compiler Enforcement

```sh
cc -Wall -Wextra -Wformat=2 -Wformat-security file.c   # GCC/Clang check format strings against argument types
```

## See Also

- [type-fixed-width-stdint](type-fixed-width-stdint.md) - The types these format macros correspond to
- [str-avoid-scanf-unbounded](str-avoid-scanf-unbounded.md) - Bounded `scanf` usage
- [lint-enable-wall-wextra-wpedantic](lint-enable-wall-wextra-wpedantic.md) - Warning flags that catch these mismatches
