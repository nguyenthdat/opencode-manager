# mem-array-index-scale

> Use the addressing mode's built-in scale factor (1/2/4/8) that matches your element size instead of manually shifting the index

## Why It Matters

x86-64's indexed addressing mode has a hardware-supported scale field for exactly this purpose. Manually shifting the index in a separate instruction before the load duplicates what the addressing mode already does for free, and picking the wrong scale (e.g. always using 8 regardless of element size) silently reads the wrong element.

## Bad

```asm
# x86-64 AT&T - manual shift, and using the wrong scale for a 4-byte element type
.global get_int32_wrong
get_int32_wrong:
    # int32_t *arr, int64_t i -> arr[i], but element size is 4 bytes, not 8
    mov  (%rdi,%rsi,8), %eax   # BUG: scale 8 is for 8-byte elements, this is int32_t (4 bytes)
    ret
```

## Good

```asm
# x86-64 AT&T - scale matches the actual element size
.global get_int32
get_int32:
    mov  (%rdi,%rsi,4), %eax    # correct: int32_t elements are 4 bytes
    ret
```

## Scale-Factor-to-Type Reference

| C type | Element size | Addressing scale |
|---|---|---|
| `int8_t` / `char` | 1 | 1 (no scale needed) |
| `int16_t` / `short` | 2 | 2 |
| `int32_t` / `int` / `float` | 4 | 4 |
| `int64_t` / `long` / `double` / pointer | 8 | 8 |

Valid hardware scale values are only 1, 2, 4, and 8; any other element size (e.g. a 12-byte or 24-byte struct array) requires an explicit multiply, typically via `lea`'s arithmetic trick or `imul`.

```asm
# x86-64 AT&T - 24-byte struct elements: no hardware scale fits, compute manually
.global get_struct24
get_struct24:
    lea  (%rsi,%rsi,2), %rax   # rax = i*3
    lea  (%rdi,%rax,8), %rax   # rax = arr + i*3*8 = arr + i*24
    ret
```

## See Also

- [mem-x86-addressing-modes](mem-x86-addressing-modes.md) - Full addressing-mode syntax reference
- [reg-lea-arithmetic-trick](reg-lea-arithmetic-trick.md) - The multiply trick used for non-power-of-two sizes
- [mem-struct-field-padding](mem-struct-field-padding.md) - Related struct-layout correctness concern
