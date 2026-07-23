# anti-ignore-alignment-requirement

> Don't ignore the calling convention's stack alignment requirement at call boundaries

## Why It Matters

Failing to maintain the required stack alignment (16 bytes at every `call` on SysV AMD64, similarly on AAPCS64/RISC-V) produces code that appears to work in simple manual tests, then crashes or corrupts data the moment the callee (or a library it calls) uses an aligned SIMD instruction that requires the alignment the caller failed to provide.

## Bad

```asm
# x86-64 AT&T - odd number of pushes, breaking 16-byte alignment before the call
.global caller
caller:
    push %rbx
    push %r12
    push %r13          # three pushes: alignment is now off by 8 bytes
    call some_function   # BUG: some_function's internal movaps may fault
    pop  %r13
    pop  %r12
    pop  %rbx
    ret
```

## Good

```asm
# x86-64 AT&T - padding added to keep the call site 16-byte aligned
.global caller
caller:
    push %rbx
    push %r12
    push %r13
    sub  $8, %rsp        # padding restores 16-byte alignment
    call some_function
    add  $8, %rsp
    pop  %r13
    pop  %r12
    pop  %rbx
    ret
```

## Why This Bug Is So Easy to Ship Undetected

Most of the time, the misaligned call doesn't fault at all — plenty of callees never execute an aligned SIMD instruction, and even libc functions that do use them internally may take a code path in a given call that doesn't happen to hit one. The bug lies dormant until a specific callee, compiler version, or library update introduces (or takes) an aligned-SIMD code path, at which point a previously "working" call site starts crashing with no corresponding change on the caller's side at all.

## ARM64 and RISC-V Have Their Own Version of This Requirement

The exact numeric alignment and enforcement mechanism differ, but the same category of mistake — an odd or miscounted number of stack adjustments before a call — applies equally on ARM64 (16-byte SP alignment enforced at every public interface, not just calls) and RISC-V (16-byte alignment in the standard calling convention):

```asm
// ARM64 - unbalanced stack adjustment breaks the required 16-byte SP alignment
.global caller_wrong
caller_wrong:
    sub  sp, sp, #8      // BUG: 8 is not a multiple of 16; SP alignment requirement violated
    bl   some_function
    add  sp, sp, #8
    ret
```

## The Fix: Track Alignment as a Running Invariant, Not an Afterthought

Rather than adding padding reactively after a crash, track the current stack alignment as you write each push/sub/add, exactly the way `mem-stack-16byte-call` describes, so every call site is provably aligned by construction rather than by accident.

## See Also

- [abi-stack-alignment-call](abi-stack-alignment-call.md) - The full rule this anti-pattern violates
- [mem-stack-16byte-call](mem-stack-16byte-call.md) - Tracking alignment as a running invariant
- [simd-alignment-requirement](simd-alignment-requirement.md) - Why callees may depend on this alignment
- [test-golden-file-disasm](test-golden-file-disasm.md) - Catching an alignment-breaking change via disassembly review
