# reg-lea-address-compute

> Use `lea` to compute an address into a register without touching memory or flags

## Why It Matters

`lea` (load effective address) evaluates an addressing expression and stores the resulting address, without dereferencing it and without affecting the flags register. It is the correct tool whenever you need an address value itself (for a later load/store, or as a pointer argument), and it is a common source of confusion when reviewers assume it reads memory.

## Bad

```asm
# x86-64 AT&T - manually building an address with arithmetic, extra instructions
.global element_ptr
element_ptr:
    # rdi = base, rsi = index -> want base + index*8 + 16
    mov  %rsi, %rax
    imul $8, %rax
    add  %rdi, %rax
    add  $16, %rax        # 3 instructions, clobbers flags each step
    ret
```

## Good

```asm
# x86-64 AT&T - single lea using scaled-index addressing
.global element_ptr
element_ptr:
    lea  16(%rdi,%rsi,8), %rax   # rax = rdi + rsi*8 + 16, no memory access
    ret
```

## ARM64 Equivalent

ARM64 has no single-instruction scaled-index-plus-displacement `lea`; compute in two steps or use `add` with an extended/shifted register operand:

```asm
// ARM64 - base + index*8 + 16
.global element_ptr
element_ptr:
    add x0, x0, x1, lsl #3   // x0 = base + index*8
    add x0, x0, #16
    ret
```

## RISC-V Equivalent

```asm
# RISC-V - base + index*8 + 16 (no scaled-addressing instruction; shift then add)
.globl element_ptr
element_ptr:
    slli t0, a1, 3
    add  a0, a0, t0
    addi a0, a0, 16
    ret
```

## See Also

- [mem-x86-addressing-modes](mem-x86-addressing-modes.md) - Full addressing-mode reference
- [reg-lea-arithmetic-trick](reg-lea-arithmetic-trick.md) - Using lea purely for arithmetic (with caveats)
- [reg-avoid-redundant-mov](reg-avoid-redundant-mov.md) - Related instruction-count minimization
