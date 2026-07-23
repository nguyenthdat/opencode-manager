# interop-preserve-caller-state

> A routine called from C must leave every register and stack location the ABI doesn't designate as scratch exactly as the caller left it

## Why It Matters

C callers (and the compiler generating their code) rely completely on the calling convention's contract: callee-saved registers unchanged, stack pointer restored, no writes below the caller's stack frame. A hand-written asm routine that violates any of these — even "just this once" for a shortcut — corrupts caller state in a way that surfaces as an apparently unrelated bug much later in execution.

## Bad

```asm
# x86-64 AT&T (SysV) - clobbers rbx (callee-saved) and leaves the stack pointer unbalanced
.global process_wrong
process_wrong:
    mov  %rdi, %rbx        # BUG: rbx is callee-saved, never restored
    push %r12                # pushed but never popped -> stack pointer imbalance on return
    # ... use rbx and r12 ...
    ret                        # returns with rsp off by 8, and rbx corrupted for the caller
```

## Good

```asm
# x86-64 AT&T (SysV) - every modification is undone before returning
.global process
process:
    push %rbx
    push %r12
    mov  %rdi, %rbx
    # ... use rbx and r12 ...
    pop  %r12
    pop  %rbx
    ret
```

## Checklist Before Any `ret`

- Every callee-saved register you wrote has been restored to its entry value
- Every `push` has a matching `pop` (or the frame was torn down via `leave`/explicit `add`)
- The stack pointer is exactly where it was at function entry, adjusted only by the return address
- Flags are not relied upon by the caller (the ABI makes no promise about them across a call)

## Verifying With a Debugger

```
(gdb) break process
(gdb) info registers
(gdb) finish
(gdb) info registers    # compare against the values before the call
```

## See Also

- [abi-callee-saved-regs](abi-callee-saved-regs.md) - Which registers this rule protects
- [abi-stack-frame-prologue](abi-stack-frame-prologue.md) - Symmetric setup/teardown that helps guarantee this
- [test-gdb-register-inspect](test-gdb-register-inspect.md) - Verifying state preservation with a debugger
