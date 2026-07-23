# doc-bit-trick-explain

> Explain any non-obvious bit manipulation trick with a comment that shows the underlying math, not just what the instruction does

## Why It Matters

Bit tricks (masking to round to a power of two, using `lea` for multiplication, branchless min/max via XOR, computing a sign mask via arithmetic shift) are individually well-known to experienced systems programmers, but nearly impossible for a reader to reverse-engineer from the instruction alone without already knowing the trick — the comment is what turns "clever" into "maintainable."

## Bad

```asm
# x86-64 AT&T - no explanation of what this computes or why
.global round_up_wrong
round_up_wrong:
    add  $15, %rdi
    and  $-16, %rdi
    mov  %rdi, %rax
    ret
```

## Good

```asm
# x86-64 AT&T
# int64_t round_up_pow2_16(int64_t n) { return (n + 15) & ~15; }
# Rounds n up to the next multiple of 16 using a bitmask trick:
#   adding 15 ensures any remainder gets pushed into the next multiple of 16,
#   then masking off the low 4 bits (via -16 == 0xFFFF...F0) truncates back down to that multiple.
.global round_up_pow2_16
round_up_pow2_16:
    add  $15, %rdi
    and  $-16, %rdi
    mov  %rdi, %rax
    ret
```

## Another Example: Branchless Sign Mask

```asm
# x86-64 AT&T
# Produces an all-1s mask if x is negative, all-0s otherwise, without branching:
#   arithmetic right-shift by 63 replicates the sign bit across the entire 64-bit register.
.global sign_mask
sign_mask:
    mov  %rdi, %rax
    sar  $63, %rax    # rax = 0xFFFF...FFFF if rdi was negative, else 0x0000...0000
    ret
```

## What "Explain the Math" Means in Practice

Show the algebraic identity or bit-level reasoning that makes the trick correct — not just a restatement of the instruction ("this shifts right by 63"), but *why* that shift produces a useful sign mask, so a reader unfamiliar with the trick can verify it themselves rather than trusting it blindly.

## See Also

- [reg-lea-arithmetic-trick](reg-lea-arithmetic-trick.md) - A specific trick this documentation style applies to
- [ctrl-cmov-branchless](ctrl-cmov-branchless.md) - Branchless techniques that often deserve this kind of comment
- [doc-algorithm-reference](doc-algorithm-reference.md) - Citing an external source for a non-obvious algorithm
