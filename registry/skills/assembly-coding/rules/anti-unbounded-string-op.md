# anti-unbounded-string-op

> Don't use `rep`-string operations, or any loop-based copy, without a verified upper bound on the length

## Why It Matters

`rep movsb`/`rep stosb` and hand-written copy loops are only as safe as the length value driving them; a length derived from unchecked, potentially attacker-controlled input (a network-supplied size field, an unvalidated string length) turns an ordinary copy routine into a classic buffer-overflow primitive the moment that length exceeds the destination's actual capacity.

## Bad

```asm
# x86-64 AT&T - copies exactly as many bytes as a caller-supplied (unvalidated) length says
.global copy_unchecked
copy_unchecked:
    # void copy_unchecked(void *dst, const void *src, size_t n) -- n never validated against dst's size
    mov  %rdx, %rcx
    rep  movsb          # BUG: no verification that n fits within dst's actual allocation
    ret
```

## Good

```asm
# x86-64 AT&T - reject a length exceeding the known destination capacity before copying
.equ DST_CAPACITY, 256

.global copy_checked
copy_checked:
    cmp  $DST_CAPACITY, %rdx
    ja   .reject
    mov  %rdx, %rcx
    rep  movsb
    ret
.reject:
    xor  %eax, %eax
    ret
```

## The Same Risk Applies to Hand-Written Loops, Not Just rep

Swapping `rep movsb` for a hand-rolled byte-copy loop does not fix anything if the loop's iteration count still comes from the same unvalidated source:

```asm
# x86-64 AT&T - a manual loop with the identical unbounded-length problem
.global copy_loop_unchecked
copy_loop_unchecked:
.loop:
    test %rdx, %rdx
    jz   .done
    movb (%rsi), %al
    movb %al, (%rdi)
    inc  %rsi
    inc  %rdi
    dec  %rdx           # still driven by the same unvalidated length
    jmp  .loop
.done:
    ret
```

The fix is the same regardless of which copy mechanism is used: validate the length against the destination's actual capacity before the copy begins, not partway through it.

## This Is Exactly the Historical Root Cause of Classic Buffer-Overflow Exploits

An unbounded copy driven by attacker-controlled length data is one of the oldest and most well-understood vulnerability patterns in systems programming; treating length validation as optional in hand-written asm reintroduces a class of bug that decades of hardening work (stack canaries, NX, ASLR) exist specifically to make harder to exploit — but none of those mitigations make the underlying bug acceptable to ship.

## See Also

- [safe-stack-overflow-bounds](safe-stack-overflow-bounds.md) - The broader bounds-checking discipline this violates
- [perf-string-op-rep-movsb](perf-string-op-rep-movsb.md) - The legitimate, bounded use of rep movsb
- [test-unit-test-known-vectors](test-unit-test-known-vectors.md) - Testing boundary-length inputs specifically
- [test-fuzz-via-wrapper](test-fuzz-via-wrapper.md) - Fuzzing is particularly effective at finding this exact bug class
