# simd-sse-basic-xmm

> Use SSE's 128-bit xmm registers to process 4 floats or 2 doubles per instruction instead of one scalar element at a time

## Why It Matters

SSE (available on essentially every x86-64 CPU since it's part of the baseline) operates on 128-bit registers holding multiple packed values, so a single packed instruction does the work of 2-4 scalar instructions. Writing a scalar loop where a packed instruction would do is leaving straightforward, portable performance on the table.

## Bad (Scalar Loop)

```asm
# x86-64 AT&T - scalar float addition, one element per iteration
.global add_floats_scalar
add_floats_scalar:
    # void add_floats_scalar(float *a, float *b, float *out, long n)
    xor  %rcx, %rcx
.loop:
    cmp  %rcx, %rdx      # (illustrative index compare against 4th arg n, passed via stack/reg per real ABI)
    jge  .done
    movss (%rdi,%rcx,4), %xmm0
    addss (%rsi,%rcx,4), %xmm0
    movss %xmm0, (%rdx,%rcx,4)
    inc  %rcx
    jmp  .loop
.done:
    ret
```

## Good (Packed SSE, 4 Floats at Once)

```asm
# x86-64 AT&T - packed addition processes 4 floats per instruction
.global add_floats_simd
add_floats_simd:
    # assumes n is a multiple of 4 and buffers are 16-byte aligned; see mem-natural-alignment
    xor  %rcx, %rcx
.loop:
    movaps (%rdi,%rcx,4), %xmm0    # load 4 floats from a
    addps  (%rsi,%rcx,4), %xmm0     # add 4 floats from b
    movaps %xmm0, (%rdx,%rcx,4)      # store 4 results to out
    add    $4, %rcx
    cmp    %r8, %rcx                  # compare against n (illustrative register)
    jl     .loop
    ret
```

## Scalar vs Packed Mnemonic Naming

| Scalar (1 element) | Packed (4 floats / 2 doubles) | Meaning |
|---|---|---|
| `addss` | `addps` | add |
| `mulss` | `mulps` | multiply |
| `movss` | `movaps`/`movups` | move |

`ss`/`sd` = scalar single/double; `ps`/`pd` = packed single/double.

## See Also

- [simd-avx-ymm-256](simd-avx-ymm-256.md) - The wider 256-bit AVX successor
- [simd-alignment-requirement](simd-alignment-requirement.md) - Why movaps requires 16-byte alignment
- [simd-neon-basic-vector](simd-neon-basic-vector.md) - The ARM64 equivalent instruction set
