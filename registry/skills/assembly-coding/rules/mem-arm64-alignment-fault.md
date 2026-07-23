# mem-arm64-alignment-fault

> Do not assume unaligned loads/stores always succeed on ARM64; some instructions and configurations fault on misaligned access

## Why It Matters

ARM64 normal (non-device) memory generally tolerates unaligned single-register loads/stores in most OS configurations, but exclusive/atomic accesses (`ldxr`/`stxr`, `ldaxr`/`stlxr`), certain SIMD load/store-multiple instructions, and any access to device memory (MMIO) can still fault on misalignment, and the tolerant behavior for ordinary loads is a configuration choice, not an architectural guarantee you should code against.

## Bad

```asm
// ARM64 - exclusive-access instruction on a misaligned address: undefined/faulting
.global increment_atomic_wrong
increment_atomic_wrong:
    // x0 points to a byte offset that is NOT 8-byte aligned
.retry:
    ldxr x1, [x0]        // BUG: ldxr requires natural alignment; may fault or fail spuriously
    add  x1, x1, #1
    stxr w2, x1, [x0]
    cbnz w2, .retry
    ret
```

## Good

```asm
// ARM64 - ensure the address is naturally aligned before using exclusive ops
.global increment_atomic
// precondition: counter is 8-byte aligned (enforced by the allocator/.align directive)
.section .data
.align 3
counter: .quad 0

.section .text
increment_atomic:
    adrp x0, counter
    add  x0, x0, :lo12:counter
.retry:
    ldxr x1, [x0]
    add  x1, x1, #1
    stxr w2, x1, [x0]
    cbnz w2, .retry
    ret
```

## Alignment Requirements That Are Always Enforced

| Access type | Alignment requirement |
|---|---|
| `ldxr`/`stxr`, `ldaxr`/`stlxr` (exclusive) | Always required, faults if violated |
| `ldp`/`stp` (pair) | Required for the pair's element size |
| SIMD load/store-multiple (`ld1`-`ld4` etc.) | Often required, check the specific form |
| Plain `ldr`/`str` to normal memory | Usually tolerated (with a performance cost), but device/MMIO memory always faults |

## See Also

- [mem-natural-alignment](mem-natural-alignment.md) - Baseline alignment guidance across ISAs
- [mem-x86-unaligned-penalty](mem-x86-unaligned-penalty.md) - The softer x86 failure mode for comparison
- [abi-stack-alignment-call](abi-stack-alignment-call.md) - Stack alignment, a related but distinct requirement
