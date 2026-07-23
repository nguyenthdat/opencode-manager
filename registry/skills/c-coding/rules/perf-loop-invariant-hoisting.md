# perf-loop-invariant-hoisting

> Move computation that doesn't change between loop iterations outside the loop, even though optimizing compilers often do this automatically

## Why It Matters

Recomputing a value inside a loop when it never changes across iterations wastes cycles on every pass. Modern compilers perform loop-invariant code motion automatically for pure, side-effect-free expressions — but calls to functions the compiler can't prove are pure (including most library and cross-translation-unit calls without link-time optimization) are not hoisted automatically, so writing the hoist explicitly is often necessary, not just stylistic.

## Bad

```c
for (size_t i = 0; i < strlen(s); i++) {   /* strlen(s) recomputed every iteration: compiler can't prove s is unmodified */
    process(s[i]);
}

for (size_t i = 0; i < n; i++) {
    int limit = config_get_limit();          /* opaque function call, re-invoked every iteration */
    if (arr[i] > limit) flag_it(i);
}
```

## Good

```c
size_t len = strlen(s);   /* computed once, outside the loop */
for (size_t i = 0; i < len; i++) {
    process(s[i]);
}

int limit = config_get_limit();   /* hoisted: doesn't change across iterations */
for (size_t i = 0; i < n; i++) {
    if (arr[i] > limit) flag_it(i);
}
```

## Why the Compiler Often Can't Do This for You

Without link-time optimization (or the function being visibly `static`/`inline` in the same translation unit with no observable side effects), the compiler must conservatively assume an opaque function call could have side effects or return a different value each time — it cannot safely hoist it on your behalf.

## See Also

- [str-strlen-cost-awareness](str-strlen-cost-awareness.md) - The specific `strlen`-in-a-loop instance of this pattern
- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Confirm the loop is actually hot before hand-optimizing it
- [perf-branch-prediction-hints](perf-branch-prediction-hints.md) - Another loop/branch-level optimization technique
