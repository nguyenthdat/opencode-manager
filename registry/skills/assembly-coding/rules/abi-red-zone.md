# abi-red-zone

> The SysV AMD64 128-byte red zone below rsp may be used by leaf functions without adjusting rsp

## Why It Matters

The red zone lets a leaf function (one that calls nothing else) use up to 128 bytes below `%rsp` as scratch space without emitting a `sub %rsp, N` / `add %rsp, N` pair, saving two instructions. Using it in a non-leaf function is a bug: any call (including signal handlers or interrupts on some contexts) can overwrite that memory.

## Bad

```asm
# x86-64 AT&T - non-leaf function relying on the red zone: UNSAFE
.global process
process:
    mov  %rdi, -8(%rsp)    # "scratch" write below rsp, no frame allocated
    mov  %rsi, -16(%rsp)
    call helper            # BUG: helper's own prologue can overwrite -8(%rsp)/-16(%rsp)
    mov  -8(%rsp), %rax
    ret
```

## Good

```asm
# x86-64 AT&T - allocate a real frame before calling anything
.global process
process:
    sub  $16, %rsp
    mov  %rdi, 0(%rsp)
    mov  %rsi, 8(%rsp)
    call helper
    mov  0(%rsp), %rax
    add  $16, %rsp
    ret
```

## Leaf Function: Red Zone Is Fine

```asm
# x86-64 AT&T - leaf function (calls nothing), red zone use is safe
.global sum_pair_scratch
sum_pair_scratch:
    mov  %rdi, -8(%rsp)   # scratch in red zone, no sub/add needed
    mov  %rsi, -16(%rsp)
    mov  -8(%rsp), %rax
    add  -16(%rsp), %rax
    ret
```

## Portability Note

The red zone is a SysV AMD64-specific concept. It does not exist on Windows x64 (which instead reserves a 32-byte shadow space the *caller* allocates — see `safe-shadow-space-windows`), and ARM64/RISC-V ABIs have no equivalent; always allocate an explicit frame on those targets.

## See Also

- [abi-leaf-function-omit-frame](abi-leaf-function-omit-frame.md) - Other leaf-function optimizations
- [safe-shadow-space-windows](safe-shadow-space-windows.md) - The Windows x64 analog
- [anti-missing-red-zone-awareness](anti-missing-red-zone-awareness.md) - The anti-pattern this rule prevents
- [abi-stack-frame-prologue](abi-stack-frame-prologue.md) - Standard frame setup for non-leaf functions
