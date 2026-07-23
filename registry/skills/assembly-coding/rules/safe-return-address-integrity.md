# safe-return-address-integrity

> Never write to the stack slot holding the return address (x86-64) or clobber the link register without saving it first (ARM64/RISC-V)

## Why It Matters

The return address is what lets `ret`/`ret` (or the ARM64/RISC-V link-register-based return) send control back to the correct caller. Any code path that accidentally writes to that stack slot, or overwrites the link register without having first saved and later restored it, redirects execution to an arbitrary address on return — one of the most severe classes of bug an asm routine can have, and a classic exploitation primitive if the corrupting value is ever attacker-influenced.

## Bad

```asm
# x86-64 AT&T - an off-by-one in a local-variable write overwrites the return address on the stack
.global vulnerable
vulnerable:
    push %rbp
    mov  %rsp, %rbp
    sub  $8, %rsp            # 8 bytes allocated for one local
    movq %rdi, -8(%rbp)
    movq %rsi, 8(%rbp)         # BUG: 8(%rbp) is the SAVED RBP or return address area, not a local!
    leave
    ret
```

## Good

```asm
# x86-64 AT&T - writes stay strictly within the allocated local storage
.global fixed
fixed:
    push %rbp
    mov  %rsp, %rbp
    sub  $16, %rsp             # allocate enough space for BOTH locals
    movq %rdi, -8(%rbp)
    movq %rsi, -16(%rbp)
    leave
    ret
```

## ARM64: Save the Link Register Before Any Nested Call

```asm
// ARM64 - lr (x30) must be saved before this routine calls anything else, or the return breaks
.global wrapper
wrapper:
    stp  x29, x30, [sp, #-16]!   // save frame pointer AND link register together
    bl   helper                    // helper's own execution doesn't touch OUR saved lr
    ldp  x29, x30, [sp], #16       // restore lr before returning
    ret
```

Forgetting to save `x30`/`lr` before a nested `bl` is the ARM64 equivalent of this bug: the nested call overwrites `lr` with its own return address, and the outer function's `ret` then jumps to the wrong place.

## See Also

- [safe-stack-canary-respect](safe-stack-canary-respect.md) - The compiler-side defense against exactly this bug class
- [doc-frame-layout-comment](doc-frame-layout-comment.md) - Documentation practice that helps prevent this mistake
- [abi-stack-frame-prologue](abi-stack-frame-prologue.md) - Correct frame setup that keeps locals away from this region
