# ptr-pointer-to-pointer-clarity

> Use pointer-to-pointer parameters only to let a function modify the caller's pointer itself, and name/document them clearly

## Why It Matters

`T **` is legitimate and common in C (output parameters that allocate, linked-list manipulation, iterator patterns) but is also one of the most confusing constructs for readers. Without a clear naming convention and doc comment, it's easy to misread how many levels of indirection are being modified.

## Bad

```c
/* Unclear: does this modify *out, **out, or both? */
int create(void **out);

void insert(struct node **list, int value) {
    struct node *n = malloc(sizeof(*n));
    n->value = value;
    n->next = *list;
    *list = n;
}
/* called as insert(&head, 5) with no comment explaining why &head is needed */
```

## Good

```c
/* out_ctx: on success, *out_ctx receives a newly allocated context;
 * caller owns it and must call ctx_free(). */
int ctx_create(struct ctx **out_ctx);

/* list_head: pointer to the caller's head pointer; updated in place so the
 * new node can become the new head. */
void list_insert_front(struct node **list_head, int value) {
    struct node *n = malloc(sizeof(*n));
    n->value = value;
    n->next = *list_head;
    *list_head = n;
}

struct node *head = NULL;
list_insert_front(&head, 5);   /* &head passed because head itself must change */
```

## Reading `T **` Declarations

```c
int   **pp;   /* pointer to (pointer to int) */
int  *(*fp)(); /* pointer to function returning pointer to int */
/* When in doubt, read right-to-left from the identifier, or introduce a typedef. */
```

## See Also

- [ptr-function-pointer-typedef](ptr-function-pointer-typedef.md) - Typedefs reduce this kind of confusion
- [api-out-param-convention](api-out-param-convention.md) - Broader out-parameter conventions
- [doc-document-ownership-lifetime](doc-document-ownership-lifetime.md) - Documenting what an out-param transfers
