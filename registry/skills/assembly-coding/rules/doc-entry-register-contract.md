# doc-entry-register-contract

> Document the register/stack contract (which register holds what, preconditions, return convention) directly above every routine's entry point

## Why It Matters

Unlike a high-level function signature, an asm label carries zero information about what its registers mean without an accompanying comment — the calling convention tells you *which* register holds the first argument, but not *what that argument is* or what constraints it must satisfy. A comment block at the entry point is the only place this information can live close enough to the code to stay accurate as the routine evolves.

## Bad

```asm
# x86-64 AT&T - no indication of what the arguments are or what's expected of them
.global process
process:
    test %rsi, %rsi
    jz   .done
    # ...
.done:
    ret
```

## Good

```asm
# x86-64 AT&T (SysV) - full entry contract documented
# void process(uint8_t *buf, size_t len)
#   buf : rdi - pointer to the data to process; may be NULL only if len == 0
#   len : rsi - number of bytes in buf
#   returns: void (no return value)
#   clobbers: rax, rcx (scratch only, not visible to caller)
#   preconditions: buf must be non-NULL when len > 0; no alignment requirement
.global process
process:
    test %rsi, %rsi
    jz   .Ldone
    # ...
.Ldone:
    ret
```

## Minimum Contract to Document

- The C-level function signature this routine implements (types and parameter names)
- Which register/stack location holds each argument
- The return value's register and meaning
- Any registers clobbered beyond what the ABI already permits (usually just a note that only caller-saved registers are touched, if that's the case)
- Non-obvious preconditions the routine assumes but does not itself check

## Keeping the Comment in Sync

Treat this comment as part of the function's interface — any change to the calling convention, argument meaning, or preconditions must update the comment in the same commit, exactly like updating a C header when a function signature changes.

## See Also

- [interop-c-callable-wrapper](interop-c-callable-wrapper.md) - The C-level contract this comment mirrors
- [doc-clobber-comment](doc-clobber-comment.md) - Clobber documentation in more depth
- [doc-abi-assumption-comment](doc-abi-assumption-comment.md) - File-level ABI assumptions this complements
