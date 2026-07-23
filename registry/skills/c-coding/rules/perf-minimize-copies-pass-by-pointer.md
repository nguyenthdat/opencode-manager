# perf-minimize-copies-pass-by-pointer

> Pass large structs by `const` pointer rather than by value, to avoid copying their full contents on every call

## Why It Matters

C passes structs by value by default — calling a function with a large struct argument copies every byte of it onto the stack (or into registers, for very small structs), on every call. For anything beyond a couple of machine words, this copy cost adds up in hot paths and is usually unnecessary if the function only needs to read the data.

## Bad

```c
struct big_config {
    char  name[128];
    int   settings[64];
    float weights[32];
};   /* well over 300 bytes */

void print_config(struct big_config cfg) {   /* copies the entire struct onto the stack for every call */
    printf("%s\n", cfg.name);
}
```

## Good

```c
void print_config(const struct big_config *cfg) {   /* passes an 8-byte pointer, no copy of the struct body */
    printf("%s\n", cfg->name);
}

print_config(&config);
```

## Small Structs Are Fine to Pass by Value

```c
/* A couple of machine words or less is typically cheaper to pass by value
 * than to take the address of and dereference — measure if it matters. */
struct point { int x, y; };
int distance_sq(struct point a, struct point b) {   /* fine: small, trivially copyable */
    int dx = a.x - b.x, dy = a.y - b.y;
    return dx * dx + dy * dy;
}
```

## See Also

- [ptr-const-correct-params](ptr-const-correct-params.md) - Marking the pointer read-only where the function doesn't mutate
- [perf-cache-friendly-struct-layout](perf-cache-friendly-struct-layout.md) - Related struct-layout performance considerations
- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Verify this copy is actually significant before rewriting call sites
