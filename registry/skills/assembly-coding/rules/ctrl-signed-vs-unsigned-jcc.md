# ctrl-signed-vs-unsigned-jcc

> Use the signed conditional jumps (`jl`, `jg`, `jle`, `jge`) for signed comparisons and the unsigned ones (`jb`, `ja`, `jbe`, `jae`) for unsigned comparisons

## Why It Matters

x86 provides two separate families of relational conditional jumps that read the *same* flags differently: the signed family accounts for the overflow flag, the unsigned family does not. Using the wrong family silently gives the correct answer for small positive values and the wrong answer the moment either operand's sign bit is set — a classic source of "works in testing, fails in production" bugs with pointer or unsigned-size comparisons.

## Bad

```asm
# x86-64 AT&T - comparing unsigned sizes with a signed jump: wrong when either operand is "negative" as signed
.global smaller_wrong
smaller_wrong:
    # size_t smaller_wrong(size_t a, size_t b) -- a,b are unsigned
    cmp  %rsi, %rdi
    jl   .a_is_smaller     # BUG: jl is signed; huge unsigned values look "negative" and confuse this
    mov  %rsi, %rax
    ret
.a_is_smaller:
    mov  %rdi, %rax
    ret
```

## Good

```asm
# x86-64 AT&T - unsigned comparison uses the unsigned jump family
.global smaller
smaller:
    cmp  %rsi, %rdi
    jb   .a_is_smaller     # jb: jump if below (unsigned <)
    mov  %rsi, %rax
    ret
.a_is_smaller:
    mov  %rdi, %rax
    ret
```

## Signed vs Unsigned Jump Reference

| Meaning | Signed | Unsigned |
|---|---|---|
| less than | `jl` | `jb` |
| less or equal | `jle` | `jbe` |
| greater than | `jg` | `ja` |
| greater or equal | `jge` | `jae` |
| equal / not equal | `je` / `jne` | `je` / `jne` (no signedness distinction) |

## ARM64 Has the Same Distinction

```asm
// ARM64 - b.lt/b.gt are signed; b.lo/b.hi are unsigned, mirroring x86's jl/jb split
cmp  x0, x1
b.lo .a_is_smaller     // unsigned "lower than"
```

## RISC-V Bakes Signedness Into the Branch Mnemonic

```asm
# RISC-V - separate mnemonics for signed vs unsigned, no shared flags to misread
blt  a0, a1, target      # signed less-than
bltu a0, a1, target       # unsigned less-than
```

## See Also

- [ctrl-flags-after-arith](ctrl-flags-after-arith.md) - The flags these jumps consume
- [ctrl-cmp-vs-test](ctrl-cmp-vs-test.md) - Setting up the comparison correctly
- [ctrl-riscv-branch-immediate](ctrl-riscv-branch-immediate.md) - RISC-V's register-to-register branch model
