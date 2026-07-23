# simd-fallback-scalar-path

> Always ship a correct scalar (or lower-instruction-set) fallback alongside any SIMD-optimized routine, selected at runtime

## Why It Matters

The specific SIMD extension a piece of code targets (AVX2, AVX-512, NEON dot-product extensions, RVV) is not guaranteed present on every CPU claiming the same base architecture. Shipping only the vectorized path means the program crashes with an illegal-instruction fault on older or lower-tier hardware; a runtime-selected fallback keeps the program correct everywhere while still getting the speedup where available.

## Bad

```c
/* C - unconditionally calls the AVX2 path with no fallback or feature check */
void process(float *data, size_t n) {
    process_avx2(data, n);   /* BUG: SIGILL on any CPU without AVX2 */
}
```

## Good

```c
/* C - runtime feature detection selects the best available implementation */
#include <stdbool.h>

typedef void (*process_fn)(float *, size_t);

static process_fn select_impl(void) {
    if (__builtin_cpu_supports("avx2"))   return process_avx2;
    if (__builtin_cpu_supports("sse4.2")) return process_sse42;
    return process_scalar;                 /* always-correct fallback */
}

void process(float *data, size_t n) {
    static process_fn impl = NULL;
    if (!impl) impl = select_impl();
    impl(data, n);
}
```

```asm
# process_scalar.s, x86-64 AT&T - the guaranteed-correct baseline every CPU can run
.global process_scalar
process_scalar:
    # ... plain scalar loop, no SIMD instructions at all ...
    ret
```

## Function Multi-Versioning (Let the Toolchain Do It)

GCC/Clang support `target_clones`/ifunc-based multiversioning, which generates the dispatch logic automatically from a single C source annotated with target variants — worth using instead of hand-rolled dispatch when the routine is written in C with intrinsics rather than raw asm.

```c
/* C, GCC - the compiler generates AVX2/SSE4.2/scalar variants and picks one at load time */
__attribute__((target_clones("avx2", "sse4.2", "default")))
void process(float *data, size_t n) { /* ... */ }
```

## See Also

- [simd-riscv-vector-extension](simd-riscv-vector-extension.md) - RISC-V's runtime hwcap-based detection
- [simd-masked-operations](simd-masked-operations.md) - Another feature-dependent technique needing a fallback
- [test-cross-platform-ci](test-cross-platform-ci.md) - Testing every fallback path in CI, not just the fastest one
