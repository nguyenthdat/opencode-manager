# perf-string-op-rep-movsb

> Use `rep movsb`/`rep stosb` for large memcpy/memset-style operations on modern x86-64 CPUs, but measure before assuming it beats a manual loop for your specific size range

## Why It Matters

Modern x86-64 CPUs implement "Enhanced REP MOVSB/STOSB" (ERMSB), which makes `rep movsb`/`rep stosb` competitive with or faster than hand-unrolled SIMD copy loops for medium-to-large transfers, while being far more compact in code size. For very small transfers, the fixed per-`rep` setup overhead can make it slower than a couple of plain `mov` instructions — this is a case where the "obviously simpler" instruction is also often the right performance choice, but only above a size threshold.

## Bad (Hand-Rolled Byte Loop for a Large Copy)

```asm
# x86-64 AT&T - manual byte-by-byte copy loop for a large buffer: much slower than rep movsb
.global copy_buffer_wrong
copy_buffer_wrong:
    # void copy_buffer(void *dst, const void *src, size_t n)
.loop:
    test %rdx, %rdx
    jz   .done
    movb (%rsi), %al
    movb %al, (%rdi)
    inc  %rsi
    inc  %rdi
    dec  %rdx
    jmp  .loop
.done:
    ret
```

## Good

```asm
# x86-64 AT&T - rep movsb, ERMSB-optimized on modern CPUs, for the bulk of the transfer
.global copy_buffer
copy_buffer:
    # void copy_buffer(void *dst /* rdi */, const void *src /* rsi */, size_t n /* rdx */)
    mov  %rdx, %rcx
    rep  movsb
    ret
```

## Small Transfers: A Plain Move Often Wins

```asm
# x86-64 AT&T - for a known-small, fixed-size copy, plain moves avoid rep's setup overhead entirely
.global copy_16_bytes
copy_16_bytes:
    mov  (%rsi), %rax
    mov  %rax, (%rdi)
    mov  8(%rsi), %rax
    mov  %rax, 8(%rdi)
    ret
```

## Rule of Thumb

Prefer the library's own `memcpy`/`memset` (which typically already dispatches between small-copy unrolled paths, `rep movsb`, and SIMD-based paths depending on size and detected CPU features) unless you have a specific, measured reason to hand-write the copy — reimplementing this dispatch logic by hand rarely beats a well-tuned libc.

## See Also

- [perf-profile-before-hand-tuning](perf-profile-before-hand-tuning.md) - Measure before choosing between these approaches
- [simd-sse-basic-xmm](simd-sse-basic-xmm.md) - The SIMD-based alternative for medium-sized transfers
- [anti-premature-hand-optimization](anti-premature-hand-optimization.md) - Why reaching for libc first is usually the right call
