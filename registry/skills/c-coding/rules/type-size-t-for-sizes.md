# type-size-t-for-sizes

> Use `size_t` for sizes, counts, and indices, matching what `sizeof`, `strlen`, and the allocation functions already return

## Why It Matters

`size_t` is the unsigned integer type the standard library itself uses for every size- and count-related value (`sizeof`, `strlen`, `malloc`'s parameter, array indices in idiomatic loops). Using `int` or another signed type for the same purpose forces awkward conversions at every boundary with the standard library and introduces sign-related bugs (a negative "size" is nonsensical but perfectly representable in a signed type).

## Bad

```c
int len = strlen(s);          /* implicit narrowing/sign conversion from size_t to int */
int index;
for (index = 0; index < len; index++) { }  /* signed loop variable for an inherently non-negative quantity */

void *my_malloc(int size);      /* negative size is meaningless but the type allows it */
```

## Good

```c
size_t len = strlen(s);
for (size_t index = 0; index < len; index++) { }

void *my_malloc(size_t size);     /* matches malloc's own signature; negative sizes are not representable */
```

## Watch for Unsigned Underflow When Subtracting size_t Values

```c
size_t remaining = total - used;   /* if used > total, wraps to a huge number rather than going negative */
if (used > total) {
    remaining = 0;    /* guard explicitly; this is size_t's own footgun, not a reason to avoid it */
} else {
    remaining = total - used;
}
```

## Loop Counting Down With size_t

```c
/* size_t can't go negative, so a naive `for (size_t i = n - 1; i >= 0; i--)`
 * never terminates (wraps around instead). Structure the loop to avoid it: */
for (size_t i = n; i-- > 0; ) {
    process(arr[i]);   /* correctly visits n-1 down to 0, then stops */
}
```

## See Also

- [ptr-array-decay-awareness](ptr-array-decay-awareness.md) - `sizeof`/length computations that use `size_t`
- [ub-signed-integer-overflow](ub-signed-integer-overflow.md) - Why unsigned wraparound, while defined, still needs guarding
- [type-avoid-implicit-narrowing](type-avoid-implicit-narrowing.md) - The conversion hazard `size_t` mismatches create
