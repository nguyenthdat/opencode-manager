# str-strncpy-null-termination-footgun

> `strncpy` does not guarantee null-termination and pads the remainder with zeros; handle both surprises explicitly or avoid it

## Why It Matters

`strncpy(dst, src, n)` was designed for fixed-width, not-necessarily-null-terminated fields (an old Unix filesystem convention), not as a "safe strcpy." If `src` is `n` or more bytes long, `dst` is **not** null-terminated at all. If `src` is shorter than `n`, every remaining byte up to `n` is explicitly zero-filled, which can be a hidden performance cost when `n` is much larger than the typical string.

## Bad

```c
char name[16];
strncpy(name, user_input, sizeof(name));   /* if user_input is >= 16 bytes, name has no null terminator */
printf("%s\n", name);                        /* reads past the buffer looking for a terminator that isn't there */
```

## Good

```c
char name[16];
strncpy(name, user_input, sizeof(name) - 1);
name[sizeof(name) - 1] = '\0';   /* explicitly guarantee termination */

/* Or prefer snprintf, which always null-terminates and is arguably clearer: */
char name2[16];
snprintf(name2, sizeof(name2), "%s", user_input);
```

## Where strncpy's Zero-Padding Behavior Is Actually Useful

```c
/* Fixed-width struct fields meant to be exactly N bytes, zero-padded,
 * and not necessarily null-terminated (e.g. legacy on-disk formats): */
struct tar_header {
    char name[100];   /* strncpy's zero-fill behavior matches this format's actual spec */
};
strncpy(hdr.name, filename, sizeof(hdr.name));   /* correct use, given the format's requirements */
```

## See Also

- [str-avoid-strcpy-strcat](str-avoid-strcpy-strcat.md) - Why `strncpy` isn't simply "the safe version"
- [str-null-termination-invariant](str-null-termination-invariant.md) - The broader null-termination discipline
- [str-safe-string-copy-pattern](str-safe-string-copy-pattern.md) - A helper that avoids this footgun entirely
