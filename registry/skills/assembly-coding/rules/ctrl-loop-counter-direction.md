# ctrl-loop-counter-direction

> Count a loop index down to zero when the iteration order doesn't matter, to fold the exit test into the decrement

## Why It Matters

Counting down to zero lets the loop reuse the flags set by the decrement itself (`dec`/`sub` set ZF) for the exit test, avoiding a separate `cmp` against a limit register on every iteration. It's a small saving per iteration, but hot loops run it millions of times, and it's a pattern worth recognizing when reading compiler-generated or hand-written asm.

## Bad

```asm
# x86-64 AT&T - counting up requires a separate cmp against the limit every iteration
.global clear_array_up
clear_array_up:
    xor  %rcx, %rcx
.loop:
    cmp  %rsi, %rcx        # extra compare every iteration
    jge  .done
    movq $0, (%rdi,%rcx,8)
    inc  %rcx
    jmp  .loop
.done:
    ret
```

## Good

```asm
# x86-64 AT&T - counting down folds the exit test into the decrement itself
.global clear_array_down
clear_array_down:
    test %rsi, %rsi
    jz   .done
.loop:
    dec  %rsi
    movq $0, (%rdi,%rsi,8)
    jnz  .loop              # dec already set ZF; no separate cmp needed
.done:
    ret
```

## Only Valid When Order Doesn't Matter

This transformation changes iteration order (last element processed first). It is safe for order-independent work (clearing memory, summation, independent per-element transforms) but not for anything relying on forward sequential processing (e.g. a running computation that depends on the previous element in forward order, or output that must be written in ascending order).

## Modern Compilers Often Do This Automatically

Compilers routinely perform this transformation themselves at `-O2`+ when they can prove it's safe; hand-applying it is mainly useful in code the compiler can't already optimize this way (hand-written asm, or loops with aliasing the compiler can't rule out).

## See Also

- [ctrl-tail-call-jmp](ctrl-tail-call-jmp.md) - Another small instruction-count optimization
- [ctrl-flags-after-arith](ctrl-flags-after-arith.md) - Why dec's flag side effect can be reused here
- [perf-profile-before-hand-tuning](perf-profile-before-hand-tuning.md) - Confirm the loop is actually hot before micro-tuning it
