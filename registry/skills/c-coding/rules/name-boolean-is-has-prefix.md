# name-boolean-is-has-prefix

> Name boolean-returning functions and variables with an `is_`/`has_`/`can_`/`should_` prefix so their meaning is unambiguous at every call site

## Why It Matters

A boolean without a predicate-style name reads ambiguously at the call site — `if (valid(cfg))` could easily be misread as "make it valid" rather than "check whether it's valid," and a boolean variable named `error` doesn't tell you whether `true` means "there was an error" or "no error." A consistent predicate prefix removes that ambiguity without needing to check the definition.

## Bad

```c
bool valid(const struct config *cfg);
bool retries(const struct policy *p);     /* is this a count, or "does it have retries"? */
int  error;                                  /* true means error occurred, or true means no error? unclear */

if (valid(cfg)) { ... }
```

## Good

```c
bool is_valid(const struct config *cfg);
bool has_retries(const struct policy *p);
bool should_retry(const struct policy *p, int attempt);
bool can_write(const struct file_handle *f);

bool had_error;   /* explicit, unambiguous polarity */

if (is_valid(cfg)) { ... }
```

## stdbool.h Makes the Type Explicit Too

```c
#include <stdbool.h>

bool is_empty(const struct list *l) {
    return l->head == NULL;   /* bool + is_ prefix together leave no ambiguity */
}
```

## See Also

- [name-snake-case-functions](name-snake-case-functions.md) - General function naming casing
- [type-bool-stdbool](type-bool-stdbool.md) - Using `bool` from `<stdbool.h>` instead of a bare `int`
- [name-verb-noun-function-names](name-verb-noun-function-names.md) - Naming non-boolean functions clearly too
