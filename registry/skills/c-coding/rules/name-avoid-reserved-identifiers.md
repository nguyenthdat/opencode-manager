# name-avoid-reserved-identifiers

> Never name your own identifiers with a leading underscore, or a leading underscore followed by a capital letter or another underscore — those are reserved to the C implementation

## Why It Matters

The C standard reserves several identifier patterns for the compiler and standard library's own use: any identifier beginning with two underscores, or an underscore followed by an uppercase letter, is reserved everywhere; identifiers starting with a single underscore are reserved at file scope. Using one of these forms for your own macro, function, or variable name risks an unpredictable clash with something the compiler or a system header defines — and unlike a normal name collision, this one is legal for the implementation to use without you ever having "used it first."

## Bad

```c
#define _MAX_BUFFER 1024        /* reserved pattern: leading underscore + uppercase */
int __internal_helper(void);     /* reserved: leading double underscore */
static int _private_flag;          /* reserved at file scope: leading underscore */
```

## Good

```c
#define MYLIB_MAX_BUFFER 1024
static int mylib_internal_helper(void);
static int mylib_private_flag_;   /* trailing underscore, or a project-specific prefix, is not reserved */
```

## Where This Bites in Practice

```c
/* A header that defines _FOO_H_ instead of FOO_H as its include guard is
 * technically relying on reserved-identifier space; on some platforms/libc
 * versions a system header may already define an overlapping reserved macro,
 * causing confusing, hard-to-diagnose build failures. */
```

## See Also

- [name-header-guard-naming](name-header-guard-naming.md) - Include guard naming, another place this rule applies
- [api-consistent-prefix-naming](api-consistent-prefix-naming.md) - A safe alternative naming strategy (your own project prefix)
- [name-static-file-scope-prefix](name-static-file-scope-prefix.md) - File-scope naming that stays clear of reserved space
