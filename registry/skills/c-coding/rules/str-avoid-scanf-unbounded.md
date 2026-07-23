# str-avoid-scanf-unbounded

> Always specify a field width with `%s`/`%[...]` in `scanf`-family calls; an unbounded `%s` is as unsafe as `gets()`

## Why It Matters

`scanf("%s", buf)` reads characters until whitespace with no regard for `buf`'s size, exactly like `gets()`. It is one of the most common ways `gets()`-equivalent overflow bugs reappear in code that otherwise avoided `gets()` directly.

## Bad

```c
char name[32];
scanf("%s", name);    /* unbounded: input longer than 31 chars overflows name */

char cmd[16];
fscanf(fp, "%s", cmd);  /* same problem reading from a file */
```

## Good

```c
char name[32];
if (scanf("%31s", name) != 1) {   /* width = buffer size - 1, leaving room for '\0' */
    handle_bad_input();
}

/* Building the width dynamically from a macro keeps it in sync with the buffer: */
#define NAME_CAP 32
#define STR(x) #x
#define XSTR(x) STR(x)
char name2[NAME_CAP];
scanf("%" XSTR(NAME_CAP) "s", name2);   /* note: still off by one if NAME_CAP itself isn't reduced by 1 */
```

## Prefer fgets + Parsing Over scanf for Untrusted Input

```c
char line[256];
if (fgets(line, sizeof(line), stdin)) {
    /* parse line with sscanf/strtol on the now-bounded buffer, or manually */
    int value;
    if (sscanf(line, "%d", &value) == 1) {
        use(value);
    }
}
```

## See Also

- [str-avoid-gets](str-avoid-gets.md) - The unbounded-read hazard this rule generalizes
- [str-buffer-size-discipline](str-buffer-size-discipline.md) - Keeping width limits tied to actual buffer sizes
- [ub-format-string-mismatch](ub-format-string-mismatch.md) - Format-specifier correctness more broadly
