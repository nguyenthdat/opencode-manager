# abi-sysv-amd64-args

> System V AMD64 passes the first six integer/pointer arguments in rdi, rsi, rdx, rcx, r8, r9

## Why It Matters

The System V AMD64 ABI (Linux, macOS, BSD) is the calling convention every C compiler, linker, and debugger on those platforms assumes. Reading an argument from the wrong register silently reads garbage or a caller-saved temporary, producing a bug that only shows up with certain compiler optimizations or call sites.

## Bad

```asm
# x86-64, AT&T syntax
# int64_t add_three(int64_t a, int64_t b, int64_t c)
.global add_three
add_three:
    mov  %rsi, %rax     # BUG: first arg is in rdi, not rsi
    add  %rdi, %rax
    add  %rdx, %rax
    ret
```

## Good

```asm
# x86-64, AT&T syntax (System V AMD64 ABI)
# a: rdi, b: rsi, c: rdx -> return in rax
.global add_three
add_three:
    mov  %rdi, %rax
    add  %rsi, %rax
    add  %rdx, %rax
    ret
```

```asm
; x86-64, Intel syntax (NASM), same ABI
global add_three
add_three:
    mov rax, rdi
    add rax, rsi
    add rax, rdx
    ret
```

## ARM64 and RISC-V Equivalents

```asm
// ARM64 (AAPCS64): args in x0, x1, x2 -> return in x0
.global add_three
add_three:
    add x0, x0, x1
    add x0, x0, x2
    ret
```

```asm
# RISC-V (integer calling convention): args in a0, a1, a2 -> return in a0
.globl add_three
add_three:
    add  a0, a0, a1
    add  a0, a0, a2
    ret
```

## Argument Register Order Reference

| ABI | Int/ptr args (in order) | Notes |
|-----|--------------------------|-------|
| SysV AMD64 | rdi, rsi, rdx, rcx, r8, r9 | 7th+ arg on stack |
| AAPCS64 (ARM64) | x0-x7 | 9th+ arg on stack |
| RISC-V | a0-a7 | 9th+ arg on stack |

## See Also

- [abi-aapcs64-args](abi-aapcs64-args.md) - ARM64 argument register convention in detail
- [abi-riscv-args](abi-riscv-args.md) - RISC-V argument register convention in detail
- [abi-return-value-regs](abi-return-value-regs.md) - Where return values live
- [abi-stack-alignment-call](abi-stack-alignment-call.md) - Stack alignment required at call sites
