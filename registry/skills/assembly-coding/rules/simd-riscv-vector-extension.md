# simd-riscv-vector-extension

> Use the RISC-V "V" vector extension's length-agnostic vector instructions when targeting hardware that implements it, instead of assuming a fixed vector width

## Why It Matters

Unlike SSE/AVX/NEON's fixed-width registers, RISC-V's Vector extension is deliberately length-agnostic: the same instructions run correctly whether the underlying hardware implements 128-bit or 2048-bit vector registers, because the code queries the actual vector length at runtime via `vsetvli` rather than hardcoding it. Writing code that assumes a specific vector length defeats this portability model.

## Bad (Assuming a Fixed Width)

```asm
# RISC-V (RVV) - hardcodes an assumed vector length instead of querying it
.globl add_vectors_wrong
add_vectors_wrong:
    li   t0, 4              # BUG: assumes exactly 4 elements fit; not portable across implementations
    vsetvli zero, t0, e32, m1
    vle32.v v0, (a0)
    vle32.v v1, (a1)
    vadd.vv v2, v0, v1
    vse32.v v2, (a2)
    ret
```

## Good (Length-Agnostic Loop)

```asm
# RISC-V (RVV) - vsetvli queries the actual vector length; loop adapts automatically
.globl add_vectors
# void add_vectors(float *a, float *b, float *out, size_t n)
add_vectors:
.loop:
    vsetvli t0, a3, e32, m1     # t0 = min(a3 remaining, hardware vector length) for 32-bit elements
    beqz    t0, .done
    vle32.v v0, (a0)
    vle32.v v1, (a1)
    vadd.vv v2, v0, v1
    vse32.v v2, (a2)
    slli    t1, t0, 2            # t1 = t0 * 4 bytes (element size)
    add     a0, a0, t1
    add     a1, a1, t1
    add     a2, a2, t1
    sub     a3, a3, t0
    j       .loop
.done:
    ret
```

## Why vsetvli Matters

`vsetvli rd, rs1, vtypei` sets the active vector length to `min(rs1, VLMAX)` for the given element width/grouping, and returns the actual length used in `rd` — the loop above uses that returned length both to know how many elements were just processed and to advance the pointers by the right byte count, working correctly regardless of the actual hardware vector register width.

## Checking for V-Extension Support

```c
/* C - runtime check before dispatching to an RVV code path (Linux hwcap-based) */
#include <sys/auxv.h>
if (getauxval(AT_HWCAP) & COMPAT_HWCAP_ISA_V) {
    add_vectors_rvv(a, b, out, n);
} else {
    add_vectors_scalar(a, b, out, n);
}
```

## See Also

- [simd-fallback-scalar-path](simd-fallback-scalar-path.md) - Providing a non-vector fallback
- [simd-neon-basic-vector](simd-neon-basic-vector.md) - The fixed-width ARM64 equivalent, for contrast
- [abi-riscv-args](abi-riscv-args.md) - Base RISC-V calling convention this builds on
