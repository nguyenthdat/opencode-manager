# ub-modifying-string-literal

> Never write through a pointer to a string literal; string literals may be stored in read-only memory

## Why It Matters

String literals (`"hello"`) have type `char[N]` but their storage is not required to be writable, and on most modern platforms it is placed in a read-only section for memory savings and security. Assigning a literal to a non-`const` `char *` and then writing through it compiles without complaint but is undefined behavior — typically a segmentation fault at runtime, sometimes silent corruption.

## Bad

```c
char *greeting = "Hello";
greeting[0] = 'h';         /* undefined behavior: literal storage may be read-only */

void to_upper_inplace(char *s) {
    for (; *s; s++) *s = toupper((unsigned char)*s);
}
to_upper_inplace("shout");  /* passing a literal into a function that mutates it: UB */
```

## Good

```c
const char *greeting = "Hello";   /* const signals "do not write through this" */
/* greeting[0] = 'h'; */            /* now a compile error, not a runtime crash */

char buf[] = "Hello";               /* array copy: writable, distinct storage per definition */
buf[0] = 'h';                        /* fine: buf owns mutable storage */

void to_upper_inplace(char *s) {
    for (; *s; s++) *s = toupper((unsigned char)*s);
}
char shout[] = "shout";
to_upper_inplace(shout);              /* array, not a literal: safe to mutate */
```

## The Key Distinction

```c
char *p  = "literal";   /* p points at possibly-read-only storage; legal but risky if you mutate through p */
char a[] = "literal";    /* a is a freshly allocated, writable array initialized from the literal */
```

## Compiler Enforcement

```sh
cc -Wwrite-strings file.c   # (GCC) treats string literals as const char*, surfacing violations at compile time
```

## See Also

- [ptr-const-correct-params](ptr-const-correct-params.md) - Marking read-only data `const` throughout
- [str-null-termination-invariant](str-null-termination-invariant.md) - Related string-handling discipline
- [mem-avoid-buffer-overflow](mem-avoid-buffer-overflow.md) - Related memory-safety category
