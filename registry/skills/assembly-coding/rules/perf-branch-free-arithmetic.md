# perf-branch-free-arithmetic

> Replace a simple conditional with branch-free arithmetic or bit-masking when the condition is data-dependent and unpredictable

## Why It Matters

Beyond `cmov`/`csel` (which still requires computing both outcomes but avoids a branch), several common conditionals can be expressed as pure arithmetic using masks derived from a comparison, entirely avoiding both the branch and any conditional-move instruction — useful when the target ISA's conditional-move support is limited, or when the arithmetic form vectorizes better than a scalar `cmov` would.

## Bad (Branch on Unpredictable Data)

```asm
# x86-64 AT&T - branch on unpredictable sign
.global abs_branch
abs_branch:
    mov  %rdi, %rax
    test %rax, %rax
    jns  .positive
    neg  %rax
.positive:
    ret
```

## Good (Branch-Free Absolute Value via Sign-Mask Arithmetic)

```asm
# x86-64 AT&T - classic branch-free abs: mask derived from the sign bit, no branch or cmov at all
.global abs_branchless
abs_branchless:
    mov  %rdi, %rax
    mov  %rdi, %rcx
    sar  $63, %rcx        # rcx = all-1s if rdi negative, all-0s if non-negative
    xor  %rcx, %rax          # flips all bits if negative (one's complement), no-op if non-negative
    sub  %rcx, %rax           # completes two's-complement negation only when rcx was all-1s
    ret
```

## Branch-Free Min/Max

```asm
# x86-64 AT&T - branch-free min using the same sign-mask technique
.global min_branchless
min_branchless:
    # int64_t min(int64_t a, int64_t b) { return b ^ ((a ^ b) & -(a < b)); }
    mov  %rdi, %rax
    cmp  %rsi, %rdi
    sbb  %rcx, %rcx           # rcx = -1 if a < b (borrow occurred), else 0
    xor  %rsi, %rax
    and  %rcx, %rax
    xor  %rsi, %rax
    ret
```

## When to Prefer This Over cmov

Branch-free arithmetic can outperform `cmov` when it vectorizes (SIMD has no per-lane branch or `cmov` equivalent in the base instruction set, but has bitwise select operations that mirror this exact technique) — see `simd-masked-operations` for the vectorized form of conditional selection.

## See Also

- [ctrl-cmov-branchless](ctrl-cmov-branchless.md) - The more readable, usually-preferred branch-free alternative
- [simd-masked-operations](simd-masked-operations.md) - The vectorized analog of this bitmask technique
- [doc-bit-trick-explain](doc-bit-trick-explain.md) - Document tricks like these thoroughly; they are not self-explanatory
