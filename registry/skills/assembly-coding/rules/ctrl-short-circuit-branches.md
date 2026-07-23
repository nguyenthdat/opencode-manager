# ctrl-short-circuit-branches

> Order a chain of branch conditions so the cheapest and/or most likely-to-short-circuit check runs first

## Why It Matters

When a routine must reject invalid input via several independent checks (null pointer, then bounds, then a more expensive validation), evaluating them in order from cheapest/most-likely-to-fail to most expensive avoids paying for later checks on inputs that already failed an earlier one. This mirrors short-circuit evaluation in high-level languages, but in asm you have to build the order yourself.

## Bad

```asm
# x86-64 AT&T - expensive check runs before a cheap null-pointer check
.global validate_wrong
validate_wrong:
    # bool validate(void *ptr, int64_t len)
    call expensive_deep_validate   # BUG: runs even if ptr is null, wasting work and risking a crash
    test %rdi, %rdi
    jz   .invalid
    ret
.invalid:
    xor  %eax, %eax
    ret
```

## Good

```asm
# x86-64 AT&T - cheapest, most-likely-to-fail check first
.global validate
validate:
    test %rdi, %rdi
    jz   .invalid              # reject null pointers immediately, cheaply
    test %rsi, %rsi
    js   .invalid                # reject negative length immediately, cheaply
    call expensive_deep_validate  # only runs once cheap checks already passed
    ret
.invalid:
    xor  %eax, %eax
    ret
```

## Balance Against Branch Predictability

If the "cheap" check almost always passes (predictable) while the "expensive" check almost always fails (also predictable, just expensive), the predictor handles both fine regardless of order — the real win here is skipping the expensive check's actual execution cost on the failure path, not branch prediction itself.

## See Also

- [ctrl-avoid-mispredict-hot-loop](ctrl-avoid-mispredict-hot-loop.md) - Related branch-structuring guidance
- [safe-uninitialized-register-read](safe-uninitialized-register-read.md) - Why null/bounds checks belong first
- [perf-profile-before-hand-tuning](perf-profile-before-hand-tuning.md) - Verify the expensive check is actually the cost driver
