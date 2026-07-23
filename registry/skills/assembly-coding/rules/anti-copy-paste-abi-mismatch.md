# anti-copy-paste-abi-mismatch

> Don't copy-paste x86-64 calling-convention assumptions into ARM64 or RISC-V code without re-deriving the correct convention for that ISA

## Why It Matters

Porting a routine from x86-64 to ARM64 or RISC-V requires re-deriving argument registers, return conventions, and callee/caller-saved sets from scratch for the new ISA — they are all different, and superficial textual similarity between assemblers (or an AI-assisted "translation" that only swaps mnemonics) is not the same as correctly re-applying the target's actual ABI.

## Bad

```asm
// ARM64 - mechanically "translated" from x86-64 SysV, but using x86-64's argument order
// (rdi=arg1, rsi=arg2) mapped incorrectly onto ARM64 registers instead of AAPCS64's real convention
.global add_three
add_three:
    // BUG: assumes some arbitrary mapping copied from the x86-64 version instead of
    // AAPCS64's actual rule (args in x0, x1, x2)
    add x2, x2, x3
    add x2, x2, x4
    mov x0, x2
    ret
```

## Good

```asm
// ARM64 (AAPCS64) - correctly re-derived from the actual ARM64 calling convention
.global add_three
add_three:
    add x0, x0, x1
    add x0, x0, x2
    ret
```

## The Same Trap Applies to Stack Alignment and Red-Zone Assumptions

Beyond argument registers, x86-64-specific concepts like the SysV red zone or the exact 16-byte call-boundary alignment rule don't automatically transfer either — ARM64 and RISC-V have their own (different) alignment requirements and no red-zone equivalent at all:

```asm
// ARM64 - incorrectly assumes a "red zone" below sp is safe scratch space, copying an x86-64 habit
.global process_wrong
process_wrong:
    str  x0, [sp, #-8]    // BUG: ARM64 has no red-zone concept; this write is below the
    bl   helper               // allocated frame and unsafe the moment helper's prologue runs
    ldr  x0, [sp, #-8]
    ret
```

```asm
// ARM64 - correct: an explicit, properly-sized frame allocated before any call
.global process
process:
    sub  sp, sp, #16
    str  x0, [sp]
    bl   helper
    ldr  x0, [sp]
    add  sp, sp, #16
    ret
```

## The Fix: Re-Derive, Don't Translate

Treat a port to a new ISA as a fresh implementation guided by that ISA's own ABI documentation, using the x86-64 version only as a reference for the *algorithm*, not for register roles, stack conventions, or alignment rules — those must each be independently verified against the target's actual specification.

## See Also

- [abi-aapcs64-args](abi-aapcs64-args.md) - The actual ARM64 convention to re-derive from
- [abi-riscv-args](abi-riscv-args.md) - The actual RISC-V convention to re-derive from
- [anti-assume-register-allocation](anti-assume-register-allocation.md) - The broader assumption-checking discipline this violates
- [abi-red-zone](abi-red-zone.md) - The x86-64-specific concept that has no ARM64/RISC-V equivalent
- [test-cross-platform-ci](test-cross-platform-ci.md) - Testing every ported target, not just the one it was ported from
