# err-fail-fast-invariant

> Abort immediately when an internal invariant is violated, rather than continuing with corrupted state

## Why It Matters

Once an internal invariant is broken (corrupted data structure, impossible enum value, heap corruption detected), continuing execution risks doing more damage — writing bad data to disk, sending it over the network, or making the eventual crash much harder to diagnose. Failing fast, loudly, and immediately keeps the blast radius small and the diagnostic close to the actual bug.

## Bad

```c
enum color { RED, GREEN, BLUE };

const char *color_name(enum color c) {
    switch (c) {
        case RED:   return "red";
        case GREEN: return "green";
        case BLUE:  return "blue";
    }
    return "unknown";   /* silently swallows a genuinely impossible value */
}

void process_node(struct node *n) {
    if (n->refcount < 0) {
        n->refcount = 0;    /* "fixing" corruption instead of surfacing it */
    }
}
```

## Good

```c
const char *color_name(enum color c) {
    switch (c) {
        case RED:   return "red";
        case GREEN: return "green";
        case BLUE:  return "blue";
    }
    /* Reaching here means memory corruption or an ABI mismatch: something is
     * badly wrong, and returning a fake string would hide it. */
    fprintf(stderr, "fatal: invalid color enum value %d\n", (int)c);
    abort();
}

void process_node(struct node *n) {
    if (n->refcount < 0) {
        fprintf(stderr, "fatal: refcount invariant violated (%d)\n", n->refcount);
        abort();          /* corruption detected; don't limp forward */
    }
}
```

## Fail-Fast vs Graceful Degradation

Use fail-fast for conditions that indicate memory corruption, a broken invariant, or a bug that makes further behavior unpredictable. Use graceful error returns (see `err-consistent-return-codes`) for anything that is a legitimate, anticipated failure mode driven by external input.

## See Also

- [err-assert-vs-runtime-check](err-assert-vs-runtime-check.md) - `assert` vs runtime-checked errors
- [anti-ignoring-compiler-warnings](anti-ignoring-compiler-warnings.md) - Warnings often flag the invariant violations this rule catches at runtime
- [err-error-enum-not-magic-int](err-error-enum-not-magic-int.md) - Exhaustive enum handling this rule complements
