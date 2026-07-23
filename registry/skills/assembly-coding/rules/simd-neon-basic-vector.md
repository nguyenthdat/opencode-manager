# simd-neon-basic-vector

> Use ARM64's NEON `v` registers (accessed as `.4s`/`.2d`/`.16b` etc.) to process multiple lanes per instruction

## Why It Matters

NEON is part of the mandatory ARM64 baseline (unlike optional SSE generations on x86, every ARMv8-A core has NEON), and its 128-bit vector registers overlay the same physical registers used for scalar floating point (`v0`-`v31`, aliased as `q0`-`q31`/`d0`-`d31`/`s0`-`s31`). Writing scalar loops on ARM64 skips this essentially-always-available parallelism.

## Bad (Scalar Loop)

```asm
// ARM64 - scalar addition, one float per iteration
.global add_floats_scalar
add_floats_scalar:
    // void add_floats_scalar(float *a, float *b, float *out, long n)
    mov  x4, #0
.loop:
    cmp  x4, x3
    b.ge .done
    ldr  s0, [x0, x4, lsl #2]
    ldr  s1, [x1, x4, lsl #2]
    fadd s0, s0, s1
    str  s0, [x2, x4, lsl #2]
    add  x4, x4, #1
    b    .loop
.done:
    ret
```

## Good (NEON, 4 Floats at Once)

```asm
// ARM64 - NEON packed addition, 4 floats (.4s = 4 x single-word) per instruction
.global add_floats_neon
add_floats_neon:
    // assumes n is a multiple of 4
    mov  x4, #0
.loop:
    ld1  {v0.4s}, [x0], #16     // load 4 floats from a, advance pointer
    ld1  {v1.4s}, [x1], #16      // load 4 floats from b, advance pointer
    fadd v2.4s, v0.4s, v1.4s
    st1  {v2.4s}, [x2], #16       // store 4 results, advance pointer
    add  x4, x4, #4
    cmp  x4, x3
    b.lt .loop
    ret
```

## NEON Lane-Width Suffixes

| Suffix | Meaning |
|---|---|
| `.16b` | 16 x 8-bit bytes |
| `.8h` | 8 x 16-bit halfwords |
| `.4s` | 4 x 32-bit words (float/int32) |
| `.2d` | 2 x 64-bit doublewords (double/int64) |

## Horizontal Reduction Example

```asm
// ARM64 - sum all 4 lanes of a vector into a single scalar
faddp v0.4s, v0.4s, v0.4s     // pairwise add: lanes {0+1, 2+3, 0+1, 2+3}
faddp s0, v0.2s                // final add of the two partial sums -> scalar s0
```

## See Also

- [simd-sse-basic-xmm](simd-sse-basic-xmm.md) - The x86-64 equivalent instruction set
- [simd-horizontal-vs-vertical](simd-horizontal-vs-vertical.md) - Why horizontal reductions like the one above are costlier
- [simd-alignment-requirement](simd-alignment-requirement.md) - Alignment expectations for vector loads/stores
