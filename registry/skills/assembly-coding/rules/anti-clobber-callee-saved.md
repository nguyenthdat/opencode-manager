# anti-clobber-callee-saved

> Don't modify a callee-saved register without saving and restoring it before returning

## Why It Matters

The caller trusts that a callee-saved register (`rbx`, `r12`-`r15` on SysV; `x19`-`x28` on AAPCS64; `s0`-`s11` on RISC-V) holds the same value after a call as before it — no reload, no re-verification. Clobbering one without restoring it corrupts caller state in a way that surfaces as an apparently unrelated bug, often far from the actual offending routine.

## Bad

```asm
# x86-64 AT&T (SysV) - rbx is callee-saved but never restored
.global scale_array
scale_array:
    mov  %rdi, %rbx
    # ... uses rbx ...
    ret                    # BUG: caller's rbx is now corrupted
```

## Good

```asm
# x86-64 AT&T (SysV) - save/restore rbx around its use
.global scale_array
scale_array:
    push %rbx
    mov  %rdi, %rbx
    # ... uses rbx ...
    pop  %rbx
    ret
```

## Why This Bug Is Hard to Diagnose

The corruption doesn't manifest inside `scale_array` at all — it manifests in the *caller*, potentially many instructions later, the next time the caller reads its own `rbx` expecting the value it had before the call. A debugger session that only steps through `scale_array` itself will show nothing wrong; the bug only appears once execution returns to the caller and the stale/corrupted register value gets used.

## ARM64 Equivalent

```asm
// ARM64 - x19 is callee-saved; failing to save/restore it corrupts the caller
.global scale_array_wrong
scale_array_wrong:
    mov x19, x0
    // ... uses x19 ...
    ret                     // BUG: caller's x19 is now corrupted, no save/restore occurred
```

```asm
// ARM64 - correct save/restore around the callee-saved register's use
.global scale_array
scale_array:
    stp  x19, x30, [sp, #-16]!
    mov  x19, x0
    // ... uses x19 ...
    ldp  x19, x30, [sp], #16
    ret
```

## Catching This in Review

A reviewer checking a routine's clobber discipline should specifically ask: for every register this routine writes to, is it either (a) a declared output/return register, (b) a register the ABI marks caller-saved (fair game), or (c) a callee-saved register that is provably saved and restored before every `ret`? Any register that fails all three checks is a bug.

## See Also

- [abi-callee-saved-regs](abi-callee-saved-regs.md) - The full rule this anti-pattern violates
- [interop-preserve-caller-state](interop-preserve-caller-state.md) - The broader caller-state-preservation discipline
- [doc-clobber-comment](doc-clobber-comment.md) - Documenting what a routine actually touches, to catch this in review
- [test-gdb-register-inspect](test-gdb-register-inspect.md) - Verifying register preservation with a debugger, from the caller's side
