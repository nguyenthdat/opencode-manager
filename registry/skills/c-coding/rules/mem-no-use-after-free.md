# mem-no-use-after-free

> Never dereference or use memory after it has been freed

## Why It Matters

Once `free()` runs, the allocator may reuse that memory for a completely unrelated allocation. Reading it gives you garbage or someone else's data; writing to it corrupts that other allocation. Use-after-free is undefined behavior and one of the most commonly exploited memory-safety bugs in C.

## Bad

```c
struct token *t = tokenize(line);
free(t);
printf("%s\n", t->text);      /* use-after-free read */

char *cache_entry = lookup(key);
free(cache_entry);
store_for_later(cache_entry);  /* stashing a dangling pointer */
```

## Good

```c
struct token *t = tokenize(line);
printf("%s\n", t->text);      /* use it first */
free(t);
t = NULL;

char *cache_entry = lookup(key);
char *saved = strdup(cache_entry);  /* copy out what you still need */
free(cache_entry);
store_for_later(saved);              /* saved is a new, valid allocation */
```

## Common Use-After-Free Shapes

```c
/* 1. Freed in a loop body, then referenced in a later iteration */
/* 2. Freed on one error path, but still read on a shared cleanup path */
/* 3. Stored in a container (list/callback) that outlives the free() */
/* 4. Returned pointer to a stack-local that looks heap-like but isn't */
```

## See Also

- [mem-free-null-pointer](mem-free-null-pointer.md) - Null pointers immediately after freeing
- [mem-single-owner-free](mem-single-owner-free.md) - Clear ownership prevents premature frees
- [lint-address-sanitizer](lint-address-sanitizer.md) - AddressSanitizer catches use-after-free at runtime
