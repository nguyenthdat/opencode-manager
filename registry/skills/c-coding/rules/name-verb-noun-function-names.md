# name-verb-noun-function-names

> Name functions as `verb_noun` (or `module_verb_noun`) so the name alone communicates the action performed

## Why It Matters

A function name that's just a noun (`checksum(data)`) doesn't say whether it computes, validates, or resets a checksum. A consistent `verb_noun` shape makes intent readable at every call site without needing to check the declaration, and makes related operations on the same noun sort and group predictably (`buffer_create`, `buffer_resize`, `buffer_destroy`).

## Bad

```c
int checksum(const void *data, size_t len);      /* computes? validates against a stored value? */
void connection(const char *host);                  /* creates one? checks one? */
int retries(struct policy *p);                       /* getter? setter? increments a counter? */
```

## Good

```c
uint32_t compute_checksum(const void *data, size_t len);
bool     validate_checksum(const void *data, size_t len, uint32_t expected);

connection *connection_open(const char *host);
void        connection_close(connection *c);

int  policy_get_retries(const struct policy *p);
void policy_set_retries(struct policy *p, int retries);
```

## Grouping Related Operations by Noun First (module_verb_noun)

```c
buffer *buffer_create(size_t initial_cap);
void    buffer_append(buffer *b, const void *data, size_t len);
void    buffer_clear(buffer *b);
void    buffer_destroy(buffer *b);
/* all `buffer_*` functions sort together alphabetically and share one prefix */
```

## See Also

- [api-consistent-prefix-naming](api-consistent-prefix-naming.md) - The module-prefix half of this naming shape
- [name-boolean-is-has-prefix](name-boolean-is-has-prefix.md) - The predicate-specific variant of this rule
- [api-init-cleanup-pair](api-init-cleanup-pair.md) - The create/destroy verb pairing shown above
