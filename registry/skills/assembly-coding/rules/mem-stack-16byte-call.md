# mem-stack-16byte-call

> Verify stack alignment as a memory-layout invariant, not just an ABI checklist item, whenever you hand-manage the stack pointer

## Why It Matters

Stack alignment is really a memory-addressing concern: any `movaps`/aligned SIMD access to a stack-relative address, or a struct laid out on the stack that itself requires 16-byte alignment, depends on `%rsp` (or the frame base) being correctly aligned at that point — not just at the `call` instruction. Tracking the running alignment as you push/sub/add is the practical discipline that prevents both call-boundary and mid-function alignment bugs.

## Bad

```asm
# x86-64 AT&T - allocates stack space for an aligned local without checking parity
.global use_local_vector
use_local_vector:
    push %rbp
    mov  %rsp, %rbp
    sub  $16, %rsp          # intended: one 16-byte-aligned local
    # after `push %rbp`, rsp was 8 mod 16; subtracting 16 keeps it 8 mod 16, NOT 0 mod 16
    movaps %xmm0, (%rsp)     # BUG: %rsp is not actually 16-byte aligned here
    leave
    ret
```

## Good

```asm
# x86-64 AT&T - pad explicitly so the local lands on a real 16-byte boundary
.global use_local_vector
use_local_vector:
    push %rbp
    mov  %rsp, %rbp
    and  $-16, %rsp          # force 16-byte alignment directly
    sub  $16, %rsp
    movaps %xmm0, (%rsp)
    mov  %rbp, %rsp
    pop  %rbp
    ret
```

`and $-16, %rsp` clears the low 4 bits of `%rsp`, rounding it down to the nearest 16-byte boundary — a common, reliable idiom instead of manually reasoning about push/pop parity.

## Tracking Alignment by Hand

Start from the guarantee at function entry (`%rsp % 16 == 8` on SysV, right after the `call` pushed the return address), and add/subtract each stack-touching instruction's size to know the current alignment at every point — or simply force-align once with `and` when the exact math gets error-prone.

## See Also

- [abi-stack-alignment-call](abi-stack-alignment-call.md) - The ABI-level version of this same requirement
- [simd-alignment-requirement](simd-alignment-requirement.md) - Why aligned SIMD loads/stores need this
- [abi-stack-frame-prologue](abi-stack-frame-prologue.md) - Standard frame setup this builds on
