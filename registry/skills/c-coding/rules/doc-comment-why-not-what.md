# doc-comment-why-not-what

> Write comments that explain why the code does something non-obvious, not comments that just restate what the code already says

## Why It Matters

A comment that restates the code (`i++; // increment i`) adds noise without adding information, and worse, it can drift out of sync with the code it describes since nothing forces it to stay accurate. A comment explaining *why* a non-obvious choice was made (a workaround for a platform bug, a deliberately non-obvious ordering, a performance trade-off) captures information the code itself cannot express and is far more valuable to a future reader — including your future self.

## Bad

```c
i++;                           /* increment i */
retries = 3;                    /* set retries to 3 */

/* loop through the array */
for (size_t i = 0; i < n; i++) {
    process(arr[i]);
}
```

## Good

```c
/* Some embedded USB stacks report a spurious disconnect on the first poll
 * after resume; retrying up to 3 times absorbs this without surfacing an
 * error to the user. See vendor errata sheet section 4.2. */
retries = 3;

/* Deliberately iterate in reverse: process() may remove the current element
 * from arr, and forward iteration would skip the element that shifts into
 * the just-vacated slot. */
for (size_t i = n; i-- > 0; ) {
    process(arr[i]);
}
```

## When No Comment Is Needed at All

```c
size_t len = strlen(s);   /* self-explanatory: no comment adds value here */
```

## See Also

- [doc-doxygen-function-comments](doc-doxygen-function-comments.md) - Structured documentation for the "what" (signature-level contract)
- [name-verb-noun-function-names](name-verb-noun-function-names.md) - Good naming reduces how much "what" needs explaining at all
- [doc-todo-fixme-convention](doc-todo-fixme-convention.md) - A related, specific comment convention for known issues
