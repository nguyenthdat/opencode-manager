# doc-todo-fixme-tracked

> Mark unfinished work, known shortcuts, or unsafe-but-deliberate choices with a tracked `TODO`/`FIXME` comment, including who/what tracks the follow-up

## Why It Matters

Hand-written asm accumulates the same kind of "temporary" shortcuts as any other code (a hardcoded assumption not yet generalized, a known-unhandled edge case deferred for later, a workaround for a specific compiler/assembler bug) — but because asm is read far less frequently than the surrounding C/C++ code, an undocumented shortcut here is even more likely to be silently forgotten and to bite someone much later.

## Bad

```asm
# x86-64 AT&T - a silent, undocumented shortcut with no indication it's incomplete
.global process_batch
process_batch:
    # only handles buffers up to 4096 bytes; assumes caller never exceeds this
    ret
```

## Good

```asm
# x86-64 AT&T
# TODO(#482): process_batch currently assumes len <= 4096 and does not validate this.
# Callers must enforce the limit themselves until the SIMD remainder-handling path
# (tracked in issue #482) is implemented for larger buffers.
.global process_batch
process_batch:
    ret
```

## FIXME for Known-Incorrect-but-Shipped Behavior

```asm
# x86-64 AT&T
# FIXME(#510): this routine does not correctly handle len == 0 on ARM64 (see the ARM64
# variant in process_batch_arm64.s); the x86-64 version below is fine, but the two files
# have drifted. Do not "fix" only one side without checking the other.
.global process_batch
process_batch:
    ret
```

## Include a Way to Find the Follow-Up

A bare `TODO: fix this later` with no ticket/issue reference tends to never get revisited — link to an issue tracker ID, a design doc, or at minimum a specific enough description that a future `grep` for the symptom finds this comment.

## See Also

- [doc-abi-assumption-comment](doc-abi-assumption-comment.md) - Documenting assumptions that are intentional, not shortcuts
- [syntax-assembler-directive-portability](syntax-assembler-directive-portability.md) - A common source of "known non-portable" shortcuts
- [anti-no-verification-of-hand-asm](anti-no-verification-of-hand-asm.md) - Related discipline around shipping unverified shortcuts
