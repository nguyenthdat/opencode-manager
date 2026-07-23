# ub-invalid-function-pointer-cast

> Never call a function through a function pointer cast to an incompatible function type

## Why It Matters

Calling a function through a pointer whose type doesn't match the function's actual defined type — different parameter types, different return type, or a different number of parameters (outside limited, platform-specific cases) — is undefined behavior, even if the ABI "happens to" pass compatible arguments in the same registers on your current platform and compiler.

## Bad

```c
int add(int a, int b) { return a + b; }

typedef long (*binary_long_fn)(long, long);
binary_long_fn f = (binary_long_fn)add;   /* mismatched signature */
long result = f(2, 3);                      /* UB: calling through the wrong function type */

/* Generic callback tables that erase the real signature to void(*)(void) and
 * cast back to a different signature are equally unsafe: */
typedef void (*generic_fn)(void);
void handler(int code) { }
generic_fn g = (generic_fn)handler;
g();                                          /* UB: calling with wrong argument count/type */
```

## Good

```c
int add(int a, int b) { return a + b; }

typedef int (*binary_int_fn)(int, int);
binary_int_fn f = add;      /* exact type match */
int result = f(2, 3);        /* well-defined */

/* Design callback tables around one consistent signature per table (often
 * using a void *ctx parameter to carry extra data instead of varying the
 * signature): */
typedef void (*event_handler_fn)(int code, void *ctx);
void handler(int code, void *ctx) { (void)ctx; }
event_handler_fn h = handler;
h(1, NULL);
```

## The One Documented Exception

POSIX explicitly permits casting a function pointer to `void *` and back for APIs like `dlsym`, as a pragmatic accommodation — but this does not extend to casting between two different *function* pointer types and calling through the result.

## See Also

- [ptr-function-pointer-typedef](ptr-function-pointer-typedef.md) - Keeping function pointer types consistent and named
- [api-callback-with-userdata](api-callback-with-userdata.md) - A uniform-signature callback pattern
- [type-generic-macro](type-generic-macro.md) - `_Generic` as a type-safe dispatch alternative
