# reg-riscv-zero-register

> `x0`/`zero` is hardwired to the constant 0 on RISC-V: reads always return 0, writes are discarded

## Why It Matters

RISC-V has no dedicated compare-to-zero or move-immediate instructions in its base integer ISA; instead, the ISA designers made register `x0` read-only-zero and built common idioms (`li`, `mv`, `not`, unconditional jump, branch-if-zero) as pseudo-instructions on top of it. Understanding `zero` explains why RISC-V assembly reads the way it does.

## Bad (Not Using the Idiom)

```asm
# RISC-V - manually materializing zero when the `zero` register already provides it
.globl clear_and_return
clear_and_return:
    addi a0, a0, 0    # unclear intent, and doesn't actually zero a0
    ret
```

## Good

```asm
# RISC-V - use zero directly, or the mv/li pseudo-instructions built on it
.globl clear_and_return
clear_and_return:
    mv a0, zero        # a0 = 0  (expands to: addi a0, zero, 0)
    ret
```

## Common Pseudo-Instructions Built on zero

```asm
# RISC-V
mv   a0, zero        # a0 = 0            (add a0, zero, zero)
li   a0, 5           # a0 = 5            (addi a0, zero, 5, for small immediates)
beqz a0, target      # branch if a0 == 0 (beq a0, zero, target)
bnez a0, target      # branch if a0 != 0 (bne a0, zero, target)
neg  a0, a1          # a0 = -a1          (sub a0, zero, a1)
not  a0, a1          # a0 = ~a1          (xori a0, a1, -1)
```

## Writes to zero Are Silently Discarded

```asm
# RISC-V - a legitimate way to compute-and-discard, e.g. to only get flag-like side effects
# (RISC-V has no flags register, so this pattern is rarer, but writes to x0 are always no-ops)
add zero, a0, a1     # computes a0+a1 and throws it away; harmless, sometimes used as a nop-with-intent
```

## See Also

- [reg-riscv-x-registers](reg-riscv-x-registers.md) - Full RISC-V register naming reference
- [reg-arm64-zero-register](reg-arm64-zero-register.md) - The ARM64 equivalent
- [ctrl-riscv-branch-immediate](ctrl-riscv-branch-immediate.md) - Branch instructions that rely on this register
