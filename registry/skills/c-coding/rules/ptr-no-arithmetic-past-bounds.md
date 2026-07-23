# ptr-no-arithmetic-past-bounds

> Only form pointers within an array (or one past its end); never compute or dereference a pointer beyond that range

## Why It Matters

The C standard only defines pointer arithmetic that stays within an array object, or produces the address one-past-the-end (which may be compared but not dereferenced). Computing a pointer further out — even without dereferencing it — is undefined behavior, and compilers are free to optimize on the assumption it never happens, which can eliminate bounds checks you thought you had.

## Bad

```c
int arr[10];
int *p = arr + 20;     /* UB: far outside the array, even though not dereferenced */
if (p > arr + 10) { }  /* comparison result is also unspecified */

int *end = arr - 1;    /* UB: one before the start is not permitted either */
```

## Good

```c
int arr[10];
int *begin = arr;
int *end = arr + 10;          /* one-past-the-end: valid to form and compare, not to dereference */

for (int *p = begin; p != end; p++) {
    use(*p);                   /* dereferencing only within [begin, end) */
}

/* Bound arithmetic explicitly before forming a pointer from a runtime offset: */
size_t offset = compute_offset();
if (offset <= 10) {
    int *p = arr + offset;    /* offset == 10 gives the valid one-past-end pointer */
}
```

## Why Compilers Exploit This

```c
/* A compiler may assume `p + n` never wraps or leaves the object, and use that
 * assumption to reorder or eliminate a bounds check written after the fact:
 *   if (p + n < p) { ... }   // "impossible", may be optimized away
 * Always bound-check the *offset* before adding it, not the resulting pointer. */
```

## See Also

- [ptr-bounds-before-index](ptr-bounds-before-index.md) - Index-based bound checking
- [ub-out-of-bounds-access](ub-out-of-bounds-access.md) - The formal undefined-behavior rule
- [ub-null-pointer-arithmetic](ub-null-pointer-arithmetic.md) - A related special case
