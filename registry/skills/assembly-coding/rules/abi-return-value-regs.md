# abi-return-value-regs

> Return scalar values in rax (x86-64), x0 (ARM64), or a0 (RISC-V); wide values use the paired register

## Why It Matters

Every calling convention designates a fixed register (or pair) for return values. Reviewers, debuggers, and every compiler-generated caller expect the result there; putting it anywhere else means the function only "works" when called from asm that happens to read the same wrong location.

## Bad

```asm
# x86-64 AT&T - result left in the wrong register
.global square
square:
    mov  %rdi, %rbx
    imul %rbx, %rbx      # BUG: result in rbx, caller expects rax
    ret
```

## Good

```asm
# x86-64 AT&T (SysV) - 64-bit result in rax
.global square
square:
    mov  %rdi, %rax
    imul %rax, %rax
    ret
```

## Wide (128-bit) Return Values

```asm
# x86-64 AT&T - unsigned 128-bit product: high half in rdx, low half in rax
.global umul128
umul128:
    mov  %rdi, %rax
    mul  %rsi             # rdx:rax = rax * rsi
    ret
```

## Return Value Registers by ISA

| ISA | Integer return | Wide/128-bit | Float return |
|-----|-----------------|--------------|---------------|
| x86-64 SysV | rax | rdx:rax | xmm0 |
| ARM64 AAPCS64 | x0 | x1:x0 | v0/d0/s0 |
| RISC-V (RV64) | a0 | a1:a0 | fa0 |

```asm
// ARM64 - result in x0
.global square
square:
    mul x0, x0, x0
    ret
```

## See Also

- [abi-large-struct-return](abi-large-struct-return.md) - Aggregates too large for registers
- [abi-float-regs-separate](abi-float-regs-separate.md) - Why float results use a different register
- [abi-sysv-amd64-args](abi-sysv-amd64-args.md) - Argument-side convention
