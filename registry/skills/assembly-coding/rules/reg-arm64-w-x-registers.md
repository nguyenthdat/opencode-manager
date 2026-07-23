# reg-arm64-w-x-registers

> Wn is the 32-bit view and Xn is the 64-bit view of the same physical ARM64 register; writing Wn zeroes the upper 32 bits of Xn

## Why It Matters

ARM64 exposes every general-purpose register through two names: `w0`-`w30` (32-bit) and `x0`-`x30` (64-bit). This mirrors x86-64's `eax`/`rax` relationship, including the "writing the 32-bit view zero-extends" behavior — but the naming scheme (letter prefix, same number) is different enough from x86 that it is easy to reach for the wrong width out of habit.

## Bad

```asm
// ARM64 - using w0 for a pointer-sized value, silently truncating it
.global store_pointer_wrong
store_pointer_wrong:
    mov w0, x1          // BUG: truncates a 64-bit pointer to 32 bits
    ret
```

## Good

```asm
// ARM64 - use the x-view for 64-bit/pointer values, w-view for 32-bit values
.global store_pointer
store_pointer:
    mov x0, x1           // full 64-bit pointer preserved
    ret

.global add_32bit_ints
add_32bit_ints:
    add w0, w0, w1        // 32-bit int addition; upper 32 bits of x0 are zeroed
    ret
```

## Zero-Extension on 32-bit Writes

```asm
// ARM64 - writing w0 clears the upper 32 bits of x0, just like x86-64's eax/rax
mov  x0, #0xFFFFFFFFFFFFFFFF
mov  w0, #1          // x0 is now exactly 1, not 0xFFFFFFFF00000001
```

## Choosing the Right View

| Use case | Register view |
|---|---|
| Pointers, 64-bit integers, array indices | `x0`-`x30` |
| 32-bit `int`, loop counters known to fit in 32 bits | `w0`-`w30` |
| Function args/returns per AAPCS64 `int32_t`/`int64_t` | matches the C type width |

## See Also

- [reg-32bit-implicit-zero-x86-64](reg-32bit-implicit-zero-x86-64.md) - The x86-64 analog of this behavior
- [abi-aapcs64-args](abi-aapcs64-args.md) - Argument passing that relies on correct register width
- [reg-arm64-zero-register](reg-arm64-zero-register.md) - The special xzr/wzr registers
