# str-avoid-gets

> Never use `gets()`; it was removed from the C standard entirely because it cannot be used safely

## Why It Matters

`gets()` reads a line from `stdin` into a caller-provided buffer with absolutely no way to specify or enforce the buffer's size — it will write as many bytes as the input contains, unconditionally overflowing any fixed-size buffer given sufficiently long input. This is not a "use carefully" footgun; it is unfixable, which is why C11 removed `gets()` from the standard library entirely.

## Bad

```c
char name[32];
gets(name);   /* removed from C11; even where still linkable via old libc, unconditionally unsafe */
```

## Good

```c
char name[32];
if (fgets(name, sizeof(name), stdin) != NULL) {
    size_t len = strlen(name);
    if (len > 0 && name[len - 1] == '\n') {
        name[len - 1] = '\0';   /* fgets keeps the trailing newline; strip it explicitly */
    }
}
```

## POSIX getline() for Unbounded, Dynamically-Sized Input

```c
char *line = NULL;
size_t cap = 0;
ssize_t n = getline(&line, &cap, stdin);   /* grows the buffer as needed via realloc */
if (n >= 0) {
    use(line);
}
free(line);   /* caller owns the buffer getline allocated/grew */
```

## See Also

- [str-avoid-scanf-unbounded](str-avoid-scanf-unbounded.md) - The equivalent problem with unbounded `scanf("%s", ...)`
- [mem-avoid-buffer-overflow](mem-avoid-buffer-overflow.md) - The general hazard `gets()` epitomizes
- [anti-unsafe-string-functions](anti-unsafe-string-functions.md) - The broader anti-pattern category
