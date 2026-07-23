# str-avoid-strcpy-strcat

> Avoid `strcpy`/`strcat`; use a bounded alternative that takes the destination buffer's size

## Why It Matters

`strcpy` and `strcat` copy until they hit the source's null terminator, with no awareness of how large the destination buffer actually is. If the source is longer than the destination (attacker-controlled input, a config value, anything not both fixed and trusted), they overflow the buffer — a classic, still-common vulnerability class.

## Bad

```c
char path[256];
strcpy(path, base_dir);
strcat(path, "/");
strcat(path, filename);   /* if base_dir + filename exceeds 256 bytes: overflow */
```

## Good

```c
char path[256];
int n = snprintf(path, sizeof(path), "%s/%s", base_dir, filename);
if (n < 0 || (size_t)n >= sizeof(path)) {
    return -1;   /* formatting failed or would have been truncated */
}
```

## strlcpy/strlcat (BSD, Widely Available, Not in ISO C)

```c
/* strlcpy/strlcat take the full destination buffer size and always
 * null-terminate, returning the source length so truncation is detectable. */
char name[32];
size_t needed = strlcpy(name, user_input, sizeof(name));
if (needed >= sizeof(name)) {
    /* input was truncated; handle as appropriate for your API */
}
```

## strncpy Is Not a Safe Drop-in Replacement

`strncpy` has surprising truncation and null-termination behavior of its own — see the dedicated `str-strncpy-null-termination-footgun` rule before reaching for it as "the safe version of strcpy."

## See Also

- [str-strncpy-null-termination-footgun](str-strncpy-null-termination-footgun.md) - Why `strncpy` is not simply safer
- [str-safe-string-copy-pattern](str-safe-string-copy-pattern.md) - A complete, reusable bounded-copy helper
- [mem-avoid-buffer-overflow](mem-avoid-buffer-overflow.md) - The consequence this rule prevents
