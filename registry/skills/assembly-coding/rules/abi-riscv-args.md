# abi-riscv-args

> RISC-V passes the first eight integer/pointer arguments in a0-a7 (aliases for x10-x17)

## Why It Matters

RISC-V's calling convention names registers by ABI role (`a0`-`a7`, `s0`-`s11`, `t0`-`t6`) rather than raw `xN` numbers so code reads correctly without memorizing the numeric mapping. Using the raw `xN` name where the ABI name is expected still assembles, but hides the argument/return role from readers and reviewers.

## Bad

```asm
# RISC-V (RV64)
# int64_t add_three(int64_t a, int64_t b, int64_t c)
.globl add_three
add_three:
    add  x10, x11, x12   # works, but obscures that x10/11/12 == a0/a1/a2
    ret
```

## Good

```asm
# RISC-V (RV64), using ABI register names
# a: a0, b: a1, c: a2 -> return in a0
.globl add_three
add_three:
    add  a0, a0, a1
    add  a0, a0, a2
    ret
```

## Register Role Table

| ABI name | Raw name | Role | Saved by |
|----------|----------|------|----------|
| a0-a1 | x10-x11 | args / return value | caller |
| a2-a7 | x12-x17 | args | caller |
| s0-s11 | x8-x9, x18-x27 | saved registers | callee |
| t0-t6 | x5-x7, x28-x31 | temporaries | caller |
| ra | x1 | return address | caller (or saved by callee if reused) |
| sp | x2 | stack pointer | callee |

## Return Values

`a0` holds the return value; a wider (128-bit) return uses `a0:a1`. This mirrors x86-64's `rax`/`rax:rdx` and ARM64's `x0`/`x0:x1` pairing.

## See Also

- [abi-sysv-amd64-args](abi-sysv-amd64-args.md) - x86-64 equivalent
- [abi-aapcs64-args](abi-aapcs64-args.md) - ARM64 equivalent
- [reg-riscv-x-registers](reg-riscv-x-registers.md) - Full RISC-V register naming reference
- [abi-return-value-regs](abi-return-value-regs.md) - Return value conventions across ISAs
