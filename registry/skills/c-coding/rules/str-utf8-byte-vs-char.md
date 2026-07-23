# str-utf8-byte-vs-char

> Never assume one `char` equals one displayed character; treat UTF-8 text as a byte sequence and use a proper library for character-level operations

## Why It Matters

C's string functions (`strlen`, indexing, `toupper`) operate on individual `char`/`byte` values, but UTF-8 encodes non-ASCII characters as multiple bytes. Code that assumes `strlen(s)` equals "number of visible characters," or truncates a string at an arbitrary byte offset, can split a multi-byte sequence in half — producing invalid UTF-8, mojibake, or (in security-sensitive contexts) exploitable parsing confusion.

## Bad

```c
char name[16];
snprintf(name, sizeof(name), "%s", utf8_input);   /* may truncate mid-character, producing invalid UTF-8 */

size_t visible_chars = strlen(utf8_string);          /* counts bytes, not displayed characters, for non-ASCII text */

char upper = toupper(utf8_string[i]);                  /* toupper is only meaningful for single-byte ASCII input */
```

## Good

```c
/* Truncate only at a UTF-8 sequence boundary (a byte that isn't a
 * continuation byte, i.e. doesn't match the bit pattern 10xxxxxx). */
size_t utf8_safe_truncate_len(const char *s, size_t max_bytes) {
    size_t len = strnlen(s, max_bytes);
    while (len > 0 && (s[len] & 0xC0) == 0x80) {
        len--;   /* back up until we're not in the middle of a multi-byte sequence */
    }
    return len;
}

/* For real character-counting, normalization, or case-folding, use a
 * dedicated Unicode library (ICU, utf8proc) rather than hand-rolled logic — */
```

## Byte Length vs Display Width vs Codepoint Count

These are three different numbers for non-ASCII text: `strlen()` gives byte length, codepoint count requires decoding UTF-8 sequences, and display width additionally depends on wide/combining characters — don't conflate them.

## See Also

- [str-null-termination-invariant](str-null-termination-invariant.md) - The termination invariant still applies to UTF-8 buffers
- [str-buffer-size-discipline](str-buffer-size-discipline.md) - Sizing buffers correctly for multi-byte content
- [type-avoid-plain-char-arithmetic](type-avoid-plain-char-arithmetic.md) - `char` signedness pitfalls that also affect UTF-8 byte handling
