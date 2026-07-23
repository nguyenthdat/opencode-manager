# abi-stack-alignment-call

> Keep rsp 16-byte aligned at the point of every `call` on x86-64 SysV

## Why It Matters

SysV AMD64 requires `%rsp + 8` to be a multiple of 16 immediately *before* `call` (so `%rsp` is 16-aligned right after the return address is pushed, at function entry). SIMD instructions like `movaps`/`movdqa` and library code compiled to expect this will fault or silently corrupt data if the stack is misaligned when they run.

## Bad

```asm
# x86-64 AT&T - pushes an odd number of 8-byte values, breaking alignment
.global caller
caller:
    push %rbx            # rsp now misaligned relative to entry state
    push %r12
    push %r13            # 3 pushes = 24 bytes -> alignment now off by 8
    call needs_16_byte_stack   # BUG: may crash on movaps inside callee
    pop  %r13
    pop  %r12
    pop  %rbx
    ret
```

## Good

```asm
# x86-64 AT&T - pad to keep 16-byte alignment at the call
.global caller
caller:
    push %rbx
    push %r12
    push %r13
    sub  $8, %rsp         # padding: 4 * 8 = 32 bytes, still 16-aligned
    call needs_16_byte_stack
    add  $8, %rsp
    pop  %r13
    pop  %r12
    pop  %rbx
    ret
```

## Reasoning About Alignment

At the entry of `caller` (right after its own `call`), `%rsp % 16 == 8` (return address pushed). Every subsequent 8-byte push flips that parity; you need an *even* number of pushes (or explicit padding) before the next `call` so `%rsp % 16 == 8` holds again at that call site.

## ARM64 and RISC-V

ARM64 (AAPCS64) requires SP to be 16-byte aligned at all public interfaces (not just at `bl`); RISC-V requires SP 16-byte aligned at calls in the standard ABI. Both are typically maintained automatically by `sub sp, sp, #N` / `addi sp, sp, -N` with N rounded up to 16.

```asm
// ARM64: reserve 16-aligned space for two callee-saved regs
sub sp, sp, #16
stp x19, x20, [sp]
bl  callee
ldp x19, x20, [sp]
add sp, sp, #16
```

## See Also

- [mem-stack-16byte-call](mem-stack-16byte-call.md) - The same rule from the memory/addressing angle
- [abi-red-zone](abi-red-zone.md) - Related leaf-function stack usage
- [abi-stack-frame-prologue](abi-stack-frame-prologue.md) - Standard prologue/epilogue that preserves alignment
- [anti-ignore-alignment-requirement](anti-ignore-alignment-requirement.md) - Consequences of getting this wrong
