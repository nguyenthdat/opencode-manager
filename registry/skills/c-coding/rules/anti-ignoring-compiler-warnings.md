# anti-ignoring-compiler-warnings

> Don't ship code with unaddressed compiler warnings; treat every warning as a bug report until proven otherwise

## Why It Matters

Compiler warnings exist because the compiler has spotted a pattern strongly correlated with real bugs (implicit narrowing, possibly-uninitialized use, format-string mismatches). Ignoring them — or worse, letting them scroll past unread in noisy build output — means you're voluntarily discarding free, immediate bug detection that most other tools can't replicate as cheaply.

## Bad

```
warning: 'total' may be used uninitialized in this function [-Wmaybe-uninitialized]
warning: format '%d' expects argument of type 'int', but argument 3 has type 'long' [-Wformat]
warning: comparison of integers of different signs [-Wsign-compare]

$ ./build.sh && echo "build succeeded, ship it"   # warnings present, but the build "succeeded"
```

## Good

```sh
# Fix the underlying issue for each warning, then enforce with -Werror so
# warnings can never silently reappear and go unnoticed again:
cc -std=c17 -Wall -Wextra -Wpedantic -Werror -o app main.c
```

## A Warning Silenced Without Understanding It Is Still a Bug

```c
/* Don't do this just to make a warning go away without understanding why it fired: */
#pragma GCC diagnostic ignored "-Wsign-compare"   /* suppresses the symptom, not the underlying bug */

/* Instead, fix the actual comparison: */
if ((size_t)signed_value < unsigned_value) { ... }   /* explicit, correct conversion */
```

## See Also

- [lint-enable-wall-wextra-wpedantic](lint-enable-wall-wextra-wpedantic.md) - The warning baseline this rule assumes
- [lint-werror-in-ci](lint-werror-in-ci.md) - Structural enforcement so warnings can't be ignored
- [anti-mixing-signed-unsigned-compare](anti-mixing-signed-unsigned-compare.md) - A common warning this rule catches
