# ctrl-riscv-branch-immediate

> RISC-V branches compare two registers directly (no flags register); pick the mnemonic that already encodes the condition and signedness

## Why It Matters

RISC-V has no flags register at all — every conditional branch (`beq`, `bne`, `blt`, `bge`, `bltu`, `bgeu`) takes two source registers and a target label, computing the comparison and branch decision in one step. This eliminates an entire category of x86-style "flags clobbered between compare and branch" bugs, but it also means you cannot reuse a previously computed comparison result the way you can reuse x86 flags across nearby instructions.

## Bad

```asm
# RISC-V - unnecessarily materializing a boolean before branching, mimicking an x86 flags-based habit
.globl smaller_wrong
smaller_wrong:
    slt  t0, a0, a1        # t0 = (a0 < a1) ? 1 : 0
    bnez t0, .a_is_smaller  # extra instruction just to re-test what blt could do directly
    mv   a0, a1
    ret
.a_is_smaller:
    ret
```

## Good

```asm
# RISC-V - blt does the comparison and branch in a single instruction
.globl smaller
smaller:
    blt  a0, a1, .a_is_smaller
    mv   a0, a1
    ret
.a_is_smaller:
    ret
```

## Branch Instruction Reference

| Mnemonic | Meaning |
|---|---|
| `beq rs1, rs2, label` | branch if equal |
| `bne rs1, rs2, label` | branch if not equal |
| `blt rs1, rs2, label` | branch if less than (signed) |
| `bge rs1, rs2, label` | branch if greater or equal (signed) |
| `bltu rs1, rs2, label` | branch if less than (unsigned) |
| `bgeu rs1, rs2, label` | branch if greater or equal (unsigned) |
| `beqz`/`bnez` (pseudo) | branch if (not) equal to zero |

## Range Limitation

Native RISC-V conditional branches only reach ±4KB (a 12-bit signed offset); the assembler transparently expands a branch to a far target into an inverted branch over an unconditional `jal`/`j` when needed, so you rarely have to handle this by hand, but it explains why disassembly sometimes shows an extra jump around what looks like a simple branch.

## See Also

- [ctrl-signed-vs-unsigned-jcc](ctrl-signed-vs-unsigned-jcc.md) - The x86/ARM64 flags-based branch families this replaces
- [reg-riscv-zero-register](reg-riscv-zero-register.md) - The zero register used by beqz/bnez
- [ctrl-arm64-cbz-cbnz](ctrl-arm64-cbz-cbnz.md) - ARM64's comparable zero-branch shortcut
