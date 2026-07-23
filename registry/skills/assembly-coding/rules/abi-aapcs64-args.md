# abi-aapcs64-args

> ARM64 AAPCS64 passes the first eight integer/pointer arguments in x0-x7

## Why It Matters

AAPCS64 (the ARM 64-bit Procedure Call Standard) is used by every ARM64 compiler and OS (Linux, macOS/iOS, Windows on ARM). Getting register numbering or the split between integer registers (x0-x7) and floating-point/SIMD registers (v0-v7) wrong breaks interop with any C caller, including the OS loader and libc.

## Bad

```asm
// ARM64
// int64_t sub(int64_t a, int64_t b)
.global sub
sub:
    sub x0, x1, x0      // BUG: swapped operands, computes b - a instead of a - b
    ret
```

## Good

```asm
// ARM64 (AAPCS64)
// a: x0, b: x1 -> return in x0
.global sub
sub:
    sub x0, x0, x1
    ret
```

## Mixed Integer and Floating-Point Arguments

AAPCS64 assigns integer and floating-point arguments from independent register files, so a `double` argument does not consume an `x` register:

```asm
// double scale(int64_t n, double factor)
// n: x0, factor: d0 -> result: d0
.global scale
scale:
    scvtf d1, x0        // convert n to double
    fmul  d0, d1, d0
    ret
```

## Comparison With x86-64 and RISC-V

| ABI | Int args | FP args | 9th+ arg |
|-----|----------|---------|----------|
| AAPCS64 | x0-x7 | v0-v7 (d0-d7 / s0-s7) | stack |
| SysV AMD64 | rdi,rsi,rdx,rcx,r8,r9 | xmm0-xmm7 | stack |
| RISC-V | a0-a7 | fa0-fa7 | stack |

## See Also

- [abi-sysv-amd64-args](abi-sysv-amd64-args.md) - x86-64 equivalent
- [abi-riscv-args](abi-riscv-args.md) - RISC-V equivalent
- [abi-float-regs-separate](abi-float-regs-separate.md) - Why FP args use a separate register file
- [reg-arm64-w-x-registers](reg-arm64-w-x-registers.md) - Wn vs Xn register views
