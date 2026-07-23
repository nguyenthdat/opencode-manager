# anti-unsafe-string-functions

> Don't use `gets`, unbounded `strcpy`/`strcat`/`sprintf`, or unbounded `scanf("%s", ...)`; use their bounded counterparts

## Why It Matters

This family of functions determines how much to write based solely on the source data, with no awareness of the destination buffer's actual size. They are directly responsible for a large share of historical C security vulnerabilities (stack and heap buffer overflows), and every one of them has a safer, equally convenient bounded alternative.

## Bad

```c
char name[32];
gets(name);                              /* removed from the standard entirely: unfixable */
strcpy(name, user_input);                  /* no bound check */
sprintf(name, "%s", user_input);            /* no bound check */
scanf("%s", name);                            /* no bound check */
```

## Good

```c
char name[32];
if (fgets(name, sizeof(name), stdin)) { ... }
snprintf(name, sizeof(name), "%s", user_input);
scanf("%31s", name);                              /* width matches buffer size - 1 */
```

## See Also

- [str-avoid-gets](str-avoid-gets.md) - The specific, unfixable case
- [str-avoid-strcpy-strcat](str-avoid-strcpy-strcat.md) - Bounded copy/concatenation alternatives
- [str-avoid-scanf-unbounded](str-avoid-scanf-unbounded.md) - Bounded `scanf` usage
