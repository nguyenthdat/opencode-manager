# anti-magic-numbers

> Don't use unexplained numeric literals in code; name them as constants or enum values

## Why It Matters

A bare number in the middle of an expression (`if (retries > 5)`, `buf[256]`) forces a reader to guess its significance, and if the same conceptual value is repeated as a literal in several places, changing it means hunting down every occurrence with no compiler help to find them all.

## Bad

```c
if (retries > 5) {
    give_up();
}
char buf[256];
if (status == 3) {
    handle_timeout();
}
```

## Good

```c
#define MAX_RETRIES 5
#define BUFFER_SIZE 256

typedef enum { STATUS_OK, STATUS_ERROR, STATUS_PENDING, STATUS_TIMEOUT } status_t;

if (retries > MAX_RETRIES) {
    give_up();
}
char buf[BUFFER_SIZE];
if (status == STATUS_TIMEOUT) {
    handle_timeout();
}
```

## Some Literals Are Genuinely Self-Explanatory

```c
int half = total / 2;         /* 2 needs no name here */
for (int i = 0; i < 10; i++) { /* loop bound tied to an obviously-fixed, local, one-off count */ }
```

## See Also

- [err-error-enum-not-magic-int](err-error-enum-not-magic-int.md) - The specific error-code instance of this anti-pattern
- [type-enum-for-closed-sets](type-enum-for-closed-sets.md) - The preferred alternative for closed sets of values
- [name-macro-all-caps](name-macro-all-caps.md) - Naming convention for the constants used to replace magic numbers
