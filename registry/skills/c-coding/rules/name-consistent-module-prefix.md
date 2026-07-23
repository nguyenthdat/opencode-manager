# name-consistent-module-prefix

> Apply the same short module prefix to every public function, type, and constant belonging to that module, without exception

## Why It Matters

A partially-applied prefix (some functions in a module prefixed, others not) defeats the entire purpose of the convention: readers can no longer tell, just from a symbol's name, which module owns it, and the unprefixed few remain exposed to the exact namespace collisions the convention exists to prevent.

## Bad

```c
/* ring_buffer.h */
int  rb_push(ring_buffer *rb, int value);
int  rb_pop(ring_buffer *rb, int *out);
int  capacity(const ring_buffer *rb);         /* missed the rb_ prefix */
void clear_buffer(ring_buffer *rb);              /* different, inconsistent prefix style entirely */
```

## Good

```c
/* ring_buffer.h */
int  rb_push(ring_buffer *rb, int value);
int  rb_pop(ring_buffer *rb, int *out);
int  rb_capacity(const ring_buffer *rb);
void rb_clear(ring_buffer *rb);
```

## Verifying Consistency Mechanically

```sh
# Quick audit: list every exported symbol from a module's object file and
# manually confirm each one starts with the expected prefix.
nm -g --defined-only ring_buffer.o | awk '{print $3}' | grep -v '^rb_'
```

## See Also

- [api-consistent-prefix-naming](api-consistent-prefix-naming.md) - The rationale this rule is a completeness check for
- [api-minimal-public-surface](api-minimal-public-surface.md) - Ensuring only intended symbols need a prefix at all
- [proj-one-module-per-file](proj-one-module-per-file.md) - Module boundaries that define what "the prefix" covers
