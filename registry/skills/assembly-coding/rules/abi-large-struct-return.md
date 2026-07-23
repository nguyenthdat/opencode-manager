# abi-large-struct-return

> Return aggregates larger than two registers via a hidden pointer passed in rdi/x8/a0

## Why It Matters

When a struct is too large to fit in the return registers (more than 16 bytes on SysV AMD64, or more than 16 bytes on AAPCS64), the ABI passes the caller-allocated destination address as an implicit first argument, shifting the visible/explicit arguments over by one register. Forgetting this "hidden pointer" causes the callee to read its real first argument out of the wrong register, or to write results to whatever garbage address happened to be in that slot.

## Bad

```asm
# x86-64 AT&T (SysV) - struct { int64 a[3]; } make_triple(int64 x)
# 24-byte struct doesn't fit in rax:rdx -> caller passes hidden dest ptr in rdi,
# so 'x' actually arrives in rsi, not rdi
.global make_triple
make_triple:
    mov  %rdi, 0(%rdi)   # BUG: treats hidden dest ptr as if it were 'x'
    ret
```

## Good

```asm
# x86-64 AT&T (SysV)
# void make_triple(TripleRet *hidden_dest /* rdi */, int64 x /* rsi */)
.global make_triple
make_triple:
    mov  %rsi, 0(%rdi)
    mov  %rsi, 8(%rdi)
    mov  %rsi, 16(%rdi)
    mov  %rdi, %rax       # SysV also returns the dest pointer in rax
    ret
```

## ARM64 Equivalent

AAPCS64 uses `x8` specifically as the indirect-result register (not `x0`), leaving `x0`-`x7` for the real arguments:

```asm
// ARM64: void make_triple(TripleRet *hidden_dest /* x8 */, int64 x /* x0 */)
.global make_triple
make_triple:
    str x0, [x8]
    str x0, [x8, #8]
    str x0, [x8, #16]
    mov x0, x8
    ret
```

## Threshold Rule of Thumb

| ABI | Fits in registers if... |
|-----|--------------------------|
| SysV AMD64 | aggregate <= 16 bytes and no unaligned/mixed fields forcing memory class |
| AAPCS64 | aggregate <= 16 bytes |
| RISC-V | aggregate <= 16 bytes (2 XLEN registers) |

Always verify against the actual ABI document for edge cases (fields that are themselves aggregates, floating-point-only structs, etc.) rather than assuming the simple size rule always applies.

## See Also

- [abi-return-value-regs](abi-return-value-regs.md) - Simple scalar return convention
- [abi-sysv-amd64-args](abi-sysv-amd64-args.md) - Why arguments shift by one register
- [interop-struct-layout-agreement](interop-struct-layout-agreement.md) - Matching struct field offsets
