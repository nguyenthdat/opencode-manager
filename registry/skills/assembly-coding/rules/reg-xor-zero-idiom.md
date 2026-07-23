# reg-xor-zero-idiom

> Use `xor %reg, %reg` to zero a general-purpose register on x86; it is shorter and breaks false dependencies better than `mov $0`

## Why It Matters

`xor %eax, %eax` encodes in 2 bytes versus `mov $0, %eax`'s 5, and is specifically recognized by the CPU's dependency-breaking logic as "zero, no dependency on the previous value" — whereas a `mov` immediate can still be treated as depending on register-file state on some cores. This is one of the few "clever trick" idioms that compilers themselves emit by default, so it is safe and expected in hand-written code too.

## Bad

```asm
# x86-64 AT&T - correct but larger and not recognized as a dependency-breaking idiom
.global reset_counter
reset_counter:
    mov  $0, %eax
    ret
```

## Good

```asm
# x86-64 AT&T - idiomatic zeroing
.global reset_counter
reset_counter:
    xor  %eax, %eax    # zeroes eax (and the full rax, per implicit zero-extension)
    ret
```

## Caution: xor Clobbers Flags

`xor` sets flags (ZF=1, others cleared) as a side effect. Don't use it to zero a register in the middle of a sequence where you still need the previous flags from an earlier `cmp`/arithmetic instruction.

```asm
# x86-64 AT&T - BUG: xor destroys the flags cmp just set
cmp  %rsi, %rdi
xor  %eax, %eax    # clobbers ZF from the cmp above
je   .equal          # this branch no longer reflects the cmp result!
```

## ARM64 and RISC-V Equivalents

Both architectures have a dedicated always-zero register, so no arithmetic trick is needed at all:

```asm
// ARM64
mov x0, xzr        // or simply: mov x0, #0
```

```asm
# RISC-V
mv a0, zero        # or: li a0, 0
```

## See Also

- [reg-partial-register-stall](reg-partial-register-stall.md) - Another dependency-breaking concern
- [reg-arm64-zero-register](reg-arm64-zero-register.md) - ARM64's dedicated zero register
- [reg-riscv-zero-register](reg-riscv-zero-register.md) - RISC-V's dedicated zero register
- [ctrl-flags-after-arith](ctrl-flags-after-arith.md) - Which instructions affect flags
