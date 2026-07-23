# abi-stack-frame-prologue

> Set up a standard prologue (push/save frame pointer, allocate locals) and mirror it exactly in the epilogue

## Why It Matters

A conventional prologue/epilogue pair makes stack unwinding, debugging, and backtraces work (gdb, profilers, and exception unwinders all rely on being able to find the previous frame). An asymmetric prologue/epilogue — allocating N bytes but freeing a different amount, or forgetting to restore a saved register — corrupts the stack for the caller on return.

## Bad

```asm
# x86-64 AT&T - epilogue frees the wrong amount
.global sum_locals
sum_locals:
    push %rbp
    mov  %rsp, %rbp
    sub  $32, %rsp        # 32 bytes of locals
    # ... use 32(%rsp) ...
    add  $16, %rsp        # BUG: only frees 16 of the 32 bytes
    pop  %rbp
    ret
```

## Good

```asm
# x86-64 AT&T - symmetric prologue/epilogue
.global sum_locals
sum_locals:
    push %rbp
    mov  %rsp, %rbp
    sub  $32, %rsp
    # ... use -8(%rbp) .. -32(%rbp) ...
    leave                 # equivalent to: mov %rbp, %rsp; pop %rbp
    ret
```

`leave` is the standard, symmetric counterpart to `push %rbp; mov %rsp, %rbp` and is the safest way to guarantee the epilogue undoes exactly what the prologue did.

## ARM64 Equivalent

```asm
// ARM64 - frame pointer (x29) and link register (x30) saved as a pair
.global sum_locals
sum_locals:
    stp  x29, x30, [sp, #-48]!   // allocate frame, save fp/lr
    mov  x29, sp
    // ... use locals at [sp, #16] etc ...
    ldp  x29, x30, [sp], #48     // restore fp/lr, deallocate frame
    ret
```

## RISC-V Equivalent

```asm
# RISC-V - save ra and s0 (frame pointer), allocate locals
.globl sum_locals
sum_locals:
    addi sp, sp, -48
    sd   ra, 40(sp)
    sd   s0, 32(sp)
    addi s0, sp, 48
    # ... use locals ...
    ld   ra, 40(sp)
    ld   s0, 32(sp)
    addi sp, sp, 48
    ret
```

## See Also

- [abi-leaf-function-omit-frame](abi-leaf-function-omit-frame.md) - When you can skip the frame entirely
- [abi-callee-saved-regs](abi-callee-saved-regs.md) - Registers typically saved in the prologue
- [doc-frame-layout-comment](doc-frame-layout-comment.md) - Documenting frame layout for maintainers
- [anti-hardcoded-stack-offset](anti-hardcoded-stack-offset.md) - Common mistake this rule prevents
