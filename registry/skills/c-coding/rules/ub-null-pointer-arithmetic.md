# ub-null-pointer-arithmetic

> Never perform pointer arithmetic on a `NULL` pointer, including `NULL + 0`

## Why It Matters

`NULL` does not point into any object, so any arithmetic on it — even adding zero, which is sometimes assumed to be harmless — is undefined behavior per the C standard's rules for pointer arithmetic (which require the pointer and result to be within, or one-past, an array object). Some compilers optimize based on the assumption that this never happens, occasionally eliminating a "helpful" `NULL` check placed after such arithmetic.

## Bad

```c
char *base = NULL;
char *p = base + offset;    /* UB even if offset happens to be 0 */

void copy(char *dst, size_t len) {
    memcpy(dst + 0, src, len);  /* fine if dst != NULL, but callers must guarantee that: */
}
copy(NULL, 0);                    /* dst + 0 with dst == NULL is technically UB even with len == 0 */
```

## Good

```c
char *base = NULL;
char *p = (base != NULL) ? (base + offset) : NULL;

void copy(char *dst, const char *src, size_t len) {
    if (len == 0) {
        return;   /* avoid touching dst/src at all when there's nothing to copy */
    }
    memcpy(dst, src, len);
}
```

## Why This Shows Up With memcpy/memmove Specifically

The C standard requires `memcpy`'s pointer arguments to be valid even when `n == 0` (this is a known, debated corner of the standard). Defensive code guards the zero-length case explicitly rather than relying on every one of a project's `memcpy`/`memmove` calls upholding that requirement correctly when a pointer could be `NULL`.

## See Also

- [ptr-no-arithmetic-past-bounds](ptr-no-arithmetic-past-bounds.md) - The general pointer-arithmetic bound rule
- [ptr-null-check-before-deref](ptr-null-check-before-deref.md) - NULL-checking discipline this rule complements
- [ub-out-of-bounds-access](ub-out-of-bounds-access.md) - The broader out-of-bounds UB category
