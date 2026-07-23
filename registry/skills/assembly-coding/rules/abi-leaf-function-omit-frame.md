# abi-leaf-function-omit-frame

> Skip frame-pointer setup in leaf functions that need no local storage and make no calls

## Why It Matters

A leaf function — one that calls nothing else and needs no stack storage beyond registers — does not need a stack frame at all. Omitting the unnecessary `push %rbp; mov %rsp,%rbp` / `leave` pair saves instructions in a hot, frequently-called routine without sacrificing correctness, since there is nothing for a frame to protect (no nested call, no unwinding through this frame in practice).

## Bad (Unnecessary Frame)

```asm
# x86-64 AT&T - frame overhead for a trivial leaf function
.global abs64
abs64:
    push %rbp
    mov  %rsp, %rbp
    mov  %rdi, %rax
    neg  %rax
    cmovl %rdi, %rax      # cmovl only fires if original was negative... (see below)
    pop  %rbp
    ret
```

## Good

```asm
# x86-64 AT&T - no frame needed, this function calls nothing
.global abs64
abs64:
    mov  %rdi, %rax
    neg  %rax
    cmovl %rdi, %rax       # rax = rdi if rdi was already non-negative... actually:
    # correct idiom: compute neg, then select original if it was >= 0
    ret
```

## When a Frame Is Still Required

Keep the full prologue/epilogue whenever the function:
- Calls any other function (needs a valid frame for the callee's benefit and for unwinding through this frame),
- Needs more local storage than fits in registers,
- Is compiled with `-fno-omit-frame-pointer` requirements for profiling/debugging tools that walk frame pointers.

```asm
# x86-64 AT&T - this one DOES need a frame: it calls helper()
.global wrapper
wrapper:
    push %rbp
    mov  %rsp, %rbp
    call helper
    leave
    ret
```

## See Also

- [abi-stack-frame-prologue](abi-stack-frame-prologue.md) - The standard frame this rule is an exception to
- [abi-red-zone](abi-red-zone.md) - Related leaf-function stack optimization
- [perf-avoid-false-dependency](perf-avoid-false-dependency.md) - Other micro-optimizations for hot leaf routines
