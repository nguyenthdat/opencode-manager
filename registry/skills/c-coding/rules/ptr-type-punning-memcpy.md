# ptr-type-punning-memcpy

> Use `memcpy` (or a `union`) for type punning, never cast a pointer to an unrelated type and dereference it

## Why It Matters

Reading an object through a pointer of a different, incompatible type violates the strict aliasing rule and is undefined behavior, even though it "works" on many compilers at `-O0`. At higher optimization levels the compiler may assume aliasing never happens and produce incorrect code. `memcpy` is always well-defined and, for small fixed sizes, is optimized away into a plain register move by any decent compiler.

## Bad

```c
float f = 3.14f;
int bits = *(int *)&f;      /* strict-aliasing violation: UB */

uint32_t read_u32_le(const unsigned char *p) {
    return *(uint32_t *)p;   /* also UB if p isn't known to be uint32_t-aligned/typed */
}
```

## Good

```c
float f = 3.14f;
int bits;
memcpy(&bits, &f, sizeof(bits));   /* well-defined, and free after optimization */

uint32_t read_u32_le(const unsigned char *p) {
    uint32_t v;
    memcpy(&v, p, sizeof(v));
    return v;   /* handle endianness separately if needed */
}
```

## Union-Based Punning (Implementation-Defined, Not UB, in C)

```c
/* Unlike C++, plain C explicitly permits reading an inactive union member for
 * type punning (implementation-defined value, not undefined behavior). */
union u32_bytes {
    uint32_t value;
    unsigned char bytes[4];
};

union u32_bytes conv;
conv.value = 0xDEADBEEF;
unsigned char b0 = conv.bytes[0];   /* legal in C */
```

## See Also

- [ub-strict-aliasing-rule](ub-strict-aliasing-rule.md) - The formal rule this rule helps you avoid violating
- [ptr-explicit-void-cast](ptr-explicit-void-cast.md) - Related pointer-cast discipline
- [type-fixed-width-stdint](type-fixed-width-stdint.md) - Fixed-width types used in wire-format code
