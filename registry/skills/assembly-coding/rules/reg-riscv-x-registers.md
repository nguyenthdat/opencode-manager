# reg-riscv-x-registers

> Learn RISC-V's ABI register names (ra, sp, gp, tp, a0-a7, s0-s11, t0-t6), not just the raw x0-x31 numbers

## Why It Matters

RISC-V hardware only knows registers as `x0`-`x31`, but the calling convention gives each one an ABI role and a mnemonic name. Code and documentation almost universally use the ABI names; writing `x10` instead of `a0` still assembles correctly but makes the code much harder to review against the calling convention.

## Bad (Raw Names Obscure Roles)

```asm
# RISC-V - technically correct, hard to read against the ABI
.globl add_three
add_three:
    add x10, x10, x11
    add x10, x10, x12
    jalr x0, x1, 0
```

## Good

```asm
# RISC-V - ABI names make roles explicit
.globl add_three
add_three:
    add a0, a0, a1
    add a0, a0, a2
    ret              # pseudo-instruction for: jalr x0, ra, 0
```

## Full Register Name Table

| ABI name | Raw name(s) | Role |
|---|---|---|
| zero | x0 | hardwired constant 0 |
| ra | x1 | return address (caller-saved unless preserved) |
| sp | x2 | stack pointer |
| gp | x3 | global pointer |
| tp | x4 | thread pointer |
| t0-t2 | x5-x7 | temporaries (caller-saved) |
| s0/fp | x8 | saved register / frame pointer |
| s1 | x9 | saved register |
| a0-a7 | x10-x17 | arguments / return values (a0-a1) |
| s2-s11 | x18-x27 | saved registers |
| t3-t6 | x28-x31 | temporaries |

## See Also

- [abi-riscv-args](abi-riscv-args.md) - Argument register convention using these names
- [reg-riscv-zero-register](reg-riscv-zero-register.md) - The `zero`/x0 hardwired register
- [name-register-alias-descriptive](name-register-alias-descriptive.md) - Aliasing registers for readability in general
