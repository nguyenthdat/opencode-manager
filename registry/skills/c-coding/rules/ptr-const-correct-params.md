# ptr-const-correct-params

> Mark pointer parameters `const` whenever the function does not modify the pointee

## Why It Matters

`const`-correct signatures document — and let the compiler enforce — which parameters a function may mutate. Callers can pass string literals, read-only buffers, or `const` data safely, and reviewers can tell a function's side effects from its signature alone instead of reading its body.

## Bad

```c
size_t my_strlen(char *s) {              /* doesn't need to write to s */
    size_t n = 0;
    while (s[n]) n++;
    return n;
}

void print_all(struct item *items, size_t n);  /* can this mutate items? unclear */
```

## Good

```c
size_t my_strlen(const char *s) {
    size_t n = 0;
    while (s[n]) n++;
    return n;
}

void print_all(const struct item *items, size_t n);  /* signature promises read-only */
```

## const With Pointers: Read the Type Right-to-Left

```c
const char *p;        /* pointer to const char: can't modify *p, can reassign p */
char *const p2 = buf;  /* const pointer to char: can modify *p2, can't reassign p2 */
const char *const p3;  /* const pointer to const char: neither can change */

void f(const int *arr, size_t n);        /* read-only view of caller's array */
void g(int *const arr, size_t n);         /* function won't reseat arr itself (rare, less useful) */
```

## See Also

- [type-const-correctness](type-const-correctness.md) - Broader `const` discipline across the codebase
- [api-const-correct-signatures](api-const-correct-signatures.md) - Applying this at the public API boundary
- [ptr-no-arithmetic-past-bounds](ptr-no-arithmetic-past-bounds.md) - Related pointer-safety discipline
