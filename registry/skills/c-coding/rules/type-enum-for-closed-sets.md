# type-enum-for-closed-sets

> Represent a fixed, closed set of named states or options with an `enum`, not a bare `int` with implied meanings

## Why It Matters

An `int` used to represent "one of a small number of states" carries no information in the type system about which values are valid — the compiler cannot warn about an out-of-range value, an unhandled case in a `switch`, or a value assigned from the wrong "family" of constants entirely. An `enum` gives the compiler (and static analyzers) enough information to catch all three.

## Bad

```c
#define STATE_IDLE 0
#define STATE_RUNNING 1
#define STATE_STOPPED 2

int state = STATE_IDLE;
switch (state) {
    case STATE_IDLE:    handle_idle(); break;
    case STATE_RUNNING: handle_running(); break;
    /* STATE_STOPPED silently unhandled: compiler gives no warning, plain #define ints look identical to any other int */
}
```

## Good

```c
typedef enum {
    STATE_IDLE,
    STATE_RUNNING,
    STATE_STOPPED,
} state;

state s = STATE_IDLE;
switch (s) {
    case STATE_IDLE:    handle_idle(); break;
    case STATE_RUNNING: handle_running(); break;
    case STATE_STOPPED: handle_stopped(); break;
    /* -Wswitch (GCC/Clang) warns if a case is missing here, because the
     * compiler knows the exhaustive set of `state` values */
}
```

## Compiler Enforcement

```sh
cc -Wall -Wextra -Wswitch -Wswitch-enum file.c   # warns on missing enum cases in a switch
```

## See Also

- [name-enum-constant-prefix](name-enum-constant-prefix.md) - Naming convention for the enumerators
- [err-error-enum-not-magic-int](err-error-enum-not-magic-int.md) - Applying this specifically to error codes
- [anti-magic-numbers](anti-magic-numbers.md) - The general anti-pattern enums help avoid
