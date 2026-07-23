# type-avoid-plain-char-arithmetic

> Cast to `unsigned char` before passing a `char` to functions like `toupper`/`isdigit`, or before using it as an array index; plain `char`'s signedness is implementation-defined

## Why It Matters

Whether plain `char` is signed or unsigned is implementation-defined by the C standard — it varies by platform and compiler (commonly signed on x86 Linux/macOS, unsigned on ARM Linux). Character classification functions (`isalpha`, `toupper`, ...) and code that uses a `char` value as an array index both assume a non-negative value in the `unsigned char`/`EOF` range; a signed `char` holding a byte >= 0x80 becomes negative, producing undefined behavior when passed to these functions or an out-of-bounds index when used directly.

## Bad

```c
char c = read_byte();          /* could be negative if char is signed and the byte is >= 0x80 */
if (isupper(c)) { ... }           /* undefined behavior: isupper's argument must be representable as unsigned char or EOF */

int freq[256];
freq[c]++;                          /* c could be negative here: out-of-bounds array access */
```

## Good

```c
unsigned char c = (unsigned char)read_byte();
if (isupper(c)) { ... }               /* safe: definitely in [0, UCHAR_MAX] */

int freq[256];
freq[(unsigned char)c]++;                /* explicit cast guarantees a valid, non-negative index */
```

## EOF Handling for getchar()-Style Functions

```c
int ch;   /* deliberately int, not char: must be able to represent every unsigned char value plus EOF */
while ((ch = getchar()) != EOF) {
    if (isupper((unsigned char)ch)) { ... }   /* cast still required even though ch is already an int */
}
```

## See Also

- [ub-format-string-mismatch](ub-format-string-mismatch.md) - Another category of subtle, platform-dependent character/format bugs
- [type-fixed-width-stdint](type-fixed-width-stdint.md) - Choosing an unambiguous width/signedness when it matters
- [str-utf8-byte-vs-char](str-utf8-byte-vs-char.md) - Related byte-vs-character handling considerations
