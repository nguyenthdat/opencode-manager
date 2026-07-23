# ub-out-of-bounds-access

> Accessing an array or buffer outside its allocated bounds is undefined behavior, regardless of whether it "seems to work"

## Why It Matters

C performs no bounds checking. Reading one element past an array's end might return adjacent stack/heap data that happens to look plausible; writing past the end corrupts whatever is there — another variable, heap metadata, or a saved return address. The behavior is not "reads garbage" in a predictable sense; the standard places no constraints on it at all, and compilers may assume it never happens.

## Bad

```c
int scores[5] = {90, 85, 77, 92, 88};
int total = 0;
for (int i = 0; i <= 5; i++) {   /* off-by-one: i == 5 is out of bounds */
    total += scores[i];
}
```

## Good

```c
int scores[5] = {90, 85, 77, 92, 88};
int total = 0;
for (size_t i = 0; i < sizeof(scores) / sizeof(scores[0]); i++) {
    total += scores[i];
}
```

## Off-by-One Sources to Watch For

```c
/* <= instead of < in a loop bound */
for (size_t i = 0; i <= n; i++) { }        /* wrong: should be < n */

/* Forgetting the null terminator when sizing a string buffer */
char buf[strlen(s)];        /* too small by one; needs strlen(s) + 1 */

/* Confusing element count with byte count */
int arr[10];
memset(arr, 0, 10);          /* zeroes only 10 bytes, not 10 ints: use sizeof(arr) */
```

## See Also

- [ptr-bounds-before-index](ptr-bounds-before-index.md) - Preventive bound-checking pattern
- [mem-avoid-buffer-overflow](mem-avoid-buffer-overflow.md) - The memory-safety consequences
- [lint-address-sanitizer](lint-address-sanitizer.md) - Runtime detection tool
