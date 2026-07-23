# abi-callee-saved-regs

> Save and restore any callee-saved register you modify before returning

## Why It Matters

Callee-saved (non-volatile) registers hold the caller's live values across a call by convention; the caller never re-loads them after the call and simply trusts they are unchanged. Clobbering one without saving/restoring it corrupts unrelated caller state in a way that often only manifests far away from the actual bug, at a much higher optimization level or in a different caller.

## Bad

```asm
# x86-64 AT&T (SysV) - rbx is callee-saved but never restored
.global scale_array
scale_array:
    mov  %rdi, %rbx       # BUG: clobbers caller's rbx, never restored
    mov  $0, %rcx
.loop:
    imul %rsi, (%rbx,%rcx,8)
    inc  %rcx
    cmp  %rdx, %rcx
    jl   .loop
    ret
```

## Good

```asm
# x86-64 AT&T (SysV) - save/restore rbx around its use
.global scale_array
scale_array:
    push %rbx
    mov  %rdi, %rbx
    mov  $0, %rcx
.loop:
    imul %rsi, (%rbx,%rcx,8)
    inc  %rcx
    cmp  %rdx, %rcx
    jl   .loop
    pop  %rbx
    ret
```

## Callee-Saved Register Sets

| ISA | Callee-saved registers |
|-----|------------------------|
| x86-64 SysV | rbx, rbp, r12, r13, r14, r15 |
| ARM64 AAPCS64 | x19-x28, x29 (fp), sp; d8-d15 (low 64 bits) |
| RISC-V | s0-s11 (x8-x9, x18-x27), sp |

## ARM64 Example

```asm
// ARM64 - x19 is callee-saved; save/restore with the frame
.global scale_array
scale_array:
    stp  x19, x30, [sp, #-16]!   // save x19 and link register
    mov  x19, x0
    // ... use x19 ...
    ldp  x19, x30, [sp], #16
    ret
```

## See Also

- [abi-caller-saved-regs](abi-caller-saved-regs.md) - The complementary volatile register set
- [abi-stack-frame-prologue](abi-stack-frame-prologue.md) - Where saves typically happen
- [anti-clobber-callee-saved](anti-clobber-callee-saved.md) - This exact anti-pattern
- [doc-clobber-comment](doc-clobber-comment.md) - Documenting what a routine touches
