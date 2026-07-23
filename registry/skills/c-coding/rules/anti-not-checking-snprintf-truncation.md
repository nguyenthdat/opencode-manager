# anti-not-checking-snprintf-truncation

> Don't ignore `snprintf`'s return value; a return `>= buffer size` means the output was silently truncated

## Why It Matters

`snprintf` never overflows its destination buffer, which makes it easy to treat as "fire and forget" — but it still tells you, via its return value, when the formatted output didn't actually fit. Ignoring that return value means truncated output (a cut-off log message, a malformed path, a partially-written config value) passes silently as if nothing were wrong.

## Bad

```c
char path[64];
snprintf(path, sizeof(path), "%s/%s/%s", base_dir, sub_dir, filename);
open(path, O_RDONLY);   /* if the combined path didn't fit, path is silently truncated and probably wrong */
```

## Good

```c
char path[64];
int n = snprintf(path, sizeof(path), "%s/%s/%s", base_dir, sub_dir, filename);
if (n < 0 || (size_t)n >= sizeof(path)) {
    fprintf(stderr, "path too long, refusing to open a truncated path\n");
    return -ENAMETOOLONG;
}
open(path, O_RDONLY);
```

## When Truncation Is Actually Acceptable

```c
/* Truncating a display label for a fixed-width UI column may be fine —
 * but that decision should be explicit, not accidental: */
char label[16];
snprintf(label, sizeof(label), "%s", long_name);   /* deliberate: truncation here is a UI choice, not a bug */
```

## See Also

- [str-avoid-sprintf-use-snprintf](str-avoid-sprintf-use-snprintf.md) - The rule this anti-pattern is the incomplete half of
- [str-buffer-size-discipline](str-buffer-size-discipline.md) - Sizing buffers correctly in the first place
- [err-check-return-values](err-check-return-values.md) - The general discipline this specific case falls under
