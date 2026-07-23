# ctrl-tail-call-jmp

> Replace a `call` immediately followed by `ret` with a plain `jmp` when the call is in tail position

## Why It Matters

`call target; ret` pushes a return address, transfers control, and then immediately pops that same return address to return to the original caller — the callee's `ret` could just as easily return directly to whoever called the current function. Using `jmp target` instead avoids the extra stack push/pop pair, avoids growing the call stack for what is logically a loop or delegation, and is exactly the optimization compilers perform for tail calls.

## Bad

```asm
# x86-64 AT&T - unnecessary call+ret when the call is the last thing this function does
.global wrapper_wrong
wrapper_wrong:
    call real_implementation
    ret                          # this ret only undoes the call we just made
```

## Good

```asm
# x86-64 AT&T - tail call: jmp directly, let real_implementation return to OUR caller
.global wrapper
wrapper:
    jmp real_implementation
```

## Only Safe When No Cleanup Is Needed First

This transformation is only correct if nothing after the call needs to run except the return — if the wrapper allocated a stack frame or saved callee-saved registers, those must be torn down/restored *before* the tail jump, not after (since there's no "after" once you jump):

```asm
# x86-64 AT&T - tail call after restoring the frame the wrapper set up
.global wrapper_with_frame
wrapper_with_frame:
    push %rbp
    mov  %rsp, %rbp
    # ... some setup using the frame ...
    leave                    # tear down the frame BEFORE the tail jump
    jmp  real_implementation  # then jump; real_implementation's ret returns to OUR caller
```

## ARM64 Equivalent

```asm
// ARM64 - tail call via a plain branch instead of bl+ret
.global wrapper
wrapper:
    b real_implementation     // b, not bl: no link register update, no return here
```

## See Also

- [abi-stack-frame-prologue](abi-stack-frame-prologue.md) - Frame teardown that must precede a tail call
- [ctrl-loop-counter-direction](ctrl-loop-counter-direction.md) - Another small, safe instruction-count optimization
- [perf-avoid-false-dependency](perf-avoid-false-dependency.md) - Related micro-optimization discipline
