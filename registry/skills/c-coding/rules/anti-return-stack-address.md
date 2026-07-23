# anti-return-stack-address

> Don't return a pointer or reference to a local (automatic-storage) variable from a function

## Why It Matters

A local variable's storage is only guaranteed valid until the function returns; the memory is typically reused by the next function call's stack frame almost immediately. A pointer to it becomes dangling the instant the function returns, and using it is undefined behavior — one of the most common beginner mistakes in C, and still an easy one to reintroduce during a refactor.

## Bad

```c
const char *build_message(int code) {
    char msg[64];
    snprintf(msg, sizeof(msg), "error code: %d", code);
    return msg;   /* msg's storage is gone the instant this function returns */
}
```

## Good

```c
/* Caller-provided buffer: */
void build_message(int code, char *out, size_t out_size) {
    snprintf(out, out_size, "error code: %d", code);
}

/* Or heap-allocated with documented ownership transfer: */
char *build_message_owned(int code) {
    char *msg = malloc(64);
    if (msg) snprintf(msg, 64, "error code: %d", code);
    return msg;   /* caller must free() */
}
```

## See Also

- [ptr-no-dangling-return](ptr-no-dangling-return.md) - The full rule this anti-pattern violates
- [mem-stack-vs-heap](mem-stack-vs-heap.md) - When stack allocation is (and isn't) the right call
- [api-return-owned-vs-borrowed-doc](api-return-owned-vs-borrowed-doc.md) - Documenting the alternative heap-owning approach
