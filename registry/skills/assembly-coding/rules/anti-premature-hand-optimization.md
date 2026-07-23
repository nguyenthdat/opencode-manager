# anti-premature-hand-optimization

> Don't hand-write optimized assembly before a working, correct C implementation exists and profiling has confirmed the routine is actually a bottleneck

## Why It Matters

Hand-written asm is expensive to write correctly, expensive to maintain (every future bug fix or feature addition must be re-implemented in asm too), and expensive to port across architectures — none of which is worth paying for a routine that isn't measurably hot, and all of which is much easier to get right by starting from a correct, testable C reference before ever reaching for asm.

## Bad

```
# Workflow: jump straight to hand-written asm for a routine that "seems like it might be slow,"
# without ever having a working C baseline to test correctness against or profile to confirm the need.
```

## Good

```c
/* Step 1: a correct, tested C implementation first */
uint32_t compute_checksum(const uint8_t *data, size_t len) {
    uint32_t sum = 0;
    for (size_t i = 0; i < len; i++) sum += data[i];
    return sum;
}
```

```bash
# Step 2: profile to confirm this routine is actually a meaningful fraction of runtime
perf record -g ./my_program && perf report
```

```asm
# Step 3: only now, with a correct reference and confirmed hotspot, write the hand-tuned version,
# testable against the C implementation's known-correct output
.global compute_checksum
compute_checksum:
    ...
    ret
```

## The Hidden Costs That Make This Expensive

Beyond the immediate engineering time, a prematurely hand-optimized routine typically needs: a second (or third) implementation for every other targeted ISA, ongoing maintenance in lockstep with the C reference every time a bug is found or a feature changes, and a permanent tax on every future contributor who now needs asm literacy to touch that part of the codebase at all — costs that only make sense to pay once profiling has confirmed there's a real, meaningful return.

## What "Confirmed a Bottleneck" Actually Requires

Confirming a routine is worth hand-optimizing means more than a hunch that a loop "looks slow" — it means a profiler (see `perf-profile-before-hand-tuning`) showing the routine consuming a meaningful share of runtime under realistic workloads, ideally with a rough estimate of the achievable speedup (from testing a lighter-weight fix first, like enabling compiler auto-vectorization or `target-cpu`-style flags) to confirm hand-written asm is actually the next lever worth pulling, rather than the first one.

## A Cheaper Step Often Available First

Before reaching for hand-written asm, check whether the same speedup is achievable with less commitment: compiler intrinsics (portable across the compiler's supported targets, type-checked, easier to review), `-O3`/`-march=native`-style flags, or restructuring the C for better auto-vectorization — all of which are cheaper to write, test, and maintain than raw asm, and sometimes get most of the available performance on their own.

## See Also

- [perf-profile-before-hand-tuning](perf-profile-before-hand-tuning.md) - The profiling discipline this anti-pattern skips
- [test-compare-compiler-output](test-compare-compiler-output.md) - Using the C baseline as a reference once you do optimize
- [anti-no-verification-of-hand-asm](anti-no-verification-of-hand-asm.md) - The related risk of shipping unverified hand-written asm
- [simd-fallback-scalar-path](simd-fallback-scalar-path.md) - Why a portable fallback remains necessary even after optimizing
