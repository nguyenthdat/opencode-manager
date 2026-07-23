# type-const-correctness

> Apply `const` to every variable, parameter, and pointee that is not intentionally mutated, throughout the codebase, not just at public API boundaries

## Why It Matters

`const` is more than documentation: the compiler enforces it, catching accidental writes to data that should never change (a loop-invariant lookup table, a configuration value read at startup, a borrowed buffer) at compile time instead of at runtime or in production. Consistent use also lets the compiler make additional optimizations (e.g., placing genuinely constant data in read-only memory or a register rather than reloading it).

## Bad

```c
void print_report(struct report *r) {        /* mutates? unclear */
    int total = r->count * r->unit_price;      /* total never changes after this: not marked const */
    printf("Total: %d\n", total);
}

int LOOKUP_TABLE[256] = { /* ... */ };          /* never modified after init, but not const: no compiler enforcement */
```

## Good

```c
void print_report(const struct report *r) {   /* signature documents read-only access */
    const int total = r->count * r->unit_price;  /* compiler rejects any accidental later write to total */
    printf("Total: %d\n", total);
}

static const int LOOKUP_TABLE[256] = { /* ... */ };   /* may be placed in read-only memory by the linker */
```

## const Applies at Every Level of Indirection

```c
const char *p;         /* pointee is const: can't modify *p */
char *const p2 = buf;   /* pointer itself is const: can't reseat p2 */
const char *const p3;    /* both: fully immutable view */
```

## See Also

- [ptr-const-correct-params](ptr-const-correct-params.md) - Applying this specifically to function parameters
- [api-const-correct-signatures](api-const-correct-signatures.md) - Applying this at public API boundaries
- [ub-cast-away-const](ub-cast-away-const.md) - The undefined behavior of violating `const` via a cast
