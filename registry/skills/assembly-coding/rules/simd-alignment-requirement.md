# simd-alignment-requirement

> Match your SIMD load/store instruction (aligned vs unaligned) to the actual guaranteed alignment of the buffer

## Why It Matters

Aligned SIMD instructions (`movaps`/`movdqa` on SSE, similarly named forms on AVX) fault immediately if the address isn't aligned to the vector width, while unaligned forms (`movups`/`movdqu`) accept any address but can be slower, especially when they straddle a cache-line boundary. Choosing the aligned form without actually guaranteeing alignment is a crash waiting for the right (unlucky) input; choosing the unaligned form everywhere out of caution silently forfeits performance you could otherwise have for free.

## Bad

```asm
# x86-64 AT&T - movaps used on a buffer whose alignment is never actually guaranteed
.global process_wrong
process_wrong:
    # float *data (rdi) -- caller-supplied, alignment unknown
    movaps (%rdi), %xmm0   # BUG: may fault if data isn't 16-byte aligned
    ret
```

## Good

```asm
# x86-64 AT&T - either guarantee alignment at the allocation site, or use the unaligned form
.global process
process:
    movups (%rdi), %xmm0    # safe regardless of alignment
    ret
```

## Guaranteeing Alignment So You Can Use the Fast Path

```c
/* C - request aligned allocation, then it's safe (and faster) to use movaps in the asm that consumes it */
#include <stdlib.h>
float *data = aligned_alloc(16, sizeof(float) * count);
```

```asm
# x86-64 AT&T - now movaps is safe because the caller guarantees 16-byte alignment
.global process_aligned
# precondition: data must be 16-byte aligned (enforced by caller via aligned_alloc)
process_aligned:
    movaps (%rdi), %xmm0
    ret
```

## Alignment Requirement by Vector Width

| Vector width | Required alignment for the "aligned" form |
|---|---|
| SSE (128-bit, xmm) | 16 bytes |
| AVX (256-bit, ymm) | 32 bytes |
| AVX-512 (512-bit, zmm) | 64 bytes |
| NEON (128-bit, ARM64) | typically tolerant of unaligned access, but check the specific instruction |

## See Also

- [mem-x86-unaligned-penalty](mem-x86-unaligned-penalty.md) - The performance-vs-fault distinction in general
- [mem-align-directive](mem-align-directive.md) - Aligning static buffers at the assembler level
- [simd-sse-basic-xmm](simd-sse-basic-xmm.md) - Where aligned/unaligned loads are first introduced
