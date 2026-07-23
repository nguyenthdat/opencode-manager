# anti-global-mutable-state

> Don't rely on mutable global/static variables for state that should be explicit and scoped

## Why It Matters

Global mutable state creates hidden coupling between unrelated parts of a program, makes concurrent access unsafe unless every access is separately synchronized, and makes unit tests unreliable unless every test carefully resets shared state — none of which is visible just from reading a function's signature.

## Bad

```c
static int g_request_count = 0;         /* accessed and mutated from anywhere in the program */
static struct config g_config;             /* implicit dependency every function silently relies on */

void handle_request(void) {
    g_request_count++;                      /* hidden side effect, invisible from the function signature */
    if (g_config.debug_mode) { ... }
}
```

## Good

```c
struct server_state {
    int request_count;
    struct config cfg;
};

void handle_request(struct server_state *state) {
    state->request_count++;                  /* explicit, visible dependency */
    if (state->cfg.debug_mode) { ... }
}
```

## See Also

- [api-avoid-global-state](api-avoid-global-state.md) - The API-design rule this anti-pattern violates
- [conc-mutex-protect-shared-state](conc-mutex-protect-shared-state.md) - Required if global state can't be avoided
- [test-mock-via-function-pointers](test-mock-via-function-pointers.md) - Global state makes this kind of testing much harder
