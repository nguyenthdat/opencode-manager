# ctrl-cmov-branchless

> Replace an unpredictable data-dependent branch with `cmov` (x86) or `csel` (ARM64) to avoid misprediction penalties

## Why It Matters

A branch that depends on data with no discernible pattern (e.g. `if (x[i] > pivot)` over random data) mispredicts roughly half the time on modern CPUs, and a misprediction flushes the pipeline — often 15-20+ cycles. A conditional move computes both outcomes and selects one without ever branching, trading a small, constant cost for the elimination of that unpredictable penalty.

## Bad

```asm
# x86-64 AT&T - branch on unpredictable data
.global max_branch
max_branch:
    cmp  %rsi, %rdi
    jge  .a_is_max
    mov  %rsi, %rax
    ret
.a_is_max:
    mov  %rdi, %rax
    ret
```

## Good

```asm
# x86-64 AT&T - branchless max using cmovl
.global max_branchless
max_branchless:
    mov  %rdi, %rax
    cmp  %rsi, %rdi
    cmovl %rsi, %rax   # if rdi < rsi, rax = rsi
    ret
```

## ARM64 Equivalent

```asm
// ARM64 - csel selects between two already-computed values based on a condition
.global max_branchless
max_branchless:
    cmp  x0, x1
    csel x0, x1, x0, lt   // x0 = (x0 < x1) ? x1 : x0
    ret
```

## RISC-V: No Native Conditional Move (Base ISA)

The RISC-V base integer ISA has no `cmov` equivalent; branchless selection is built from branches or bit tricks (the `Zicond` extension adds `czero.eqz`/`czero.nez` where available):

```asm
# RISC-V (RV64) - branchless max without Zicond, using a mask trick
.globl max_branchless
max_branchless:
    sgt  t0, a0, a1        # t0 = (a0 > a1) ? 1 : 0
    sub  t0, zero, t0       # t0 = all-ones mask if a0>a1, else 0
    xor  t1, a0, a1
    and  t1, t1, t0
    xor  a0, a1, t1          # a0 = a1 ^ ((a0 ^ a1) & mask)
    ret
```

## When NOT to Use cmov

If the branch is highly predictable (say, a bounds check that almost always passes, or an error path taken rarely), a real branch is faster: `cmov` always computes and reads both operands, which can cost more than a well-predicted branch that skips the untaken side entirely.

## See Also

- [ctrl-avoid-mispredict-hot-loop](ctrl-avoid-mispredict-hot-loop.md) - The broader misprediction-avoidance topic
- [perf-branch-free-arithmetic](perf-branch-free-arithmetic.md) - Other branch-elimination techniques
- [ctrl-arm64-cbz-cbnz](ctrl-arm64-cbz-cbnz.md) - A different, cheap ARM64 branch form for zero checks
