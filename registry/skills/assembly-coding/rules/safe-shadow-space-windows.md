# safe-shadow-space-windows

> On Windows x64, the caller must reserve 32 bytes of "shadow space" on the stack before any `call`, even if the callee takes fewer than four arguments

## Why It Matters

The Windows x64 calling convention (distinct from SysV AMD64) requires the caller to allocate 32 bytes of stack space immediately below the return address on every call, which the callee is permitted to use to spill its first four register arguments if needed — regardless of whether the callee actually has four arguments. Skipping this allocation on a Windows-targeted routine breaks any callee that assumes the space is there, and corrupts the callee's local stack usage.

## Bad

```asm
; x86-64 Intel (NASM), Windows x64 - no shadow space reserved before the call
global caller_wrong
caller_wrong:
    sub  rsp, 8            ; BUG: not enough; Windows x64 needs 32 bytes of shadow space, not 8
    mov  rcx, 42             ; first arg (Windows x64 uses rcx, rdx, r8, r9 -- different from SysV!)
    call some_function
    add  rsp, 8
    ret
```

## Good

```asm
; x86-64 Intel (NASM), Windows x64 - 32 bytes of shadow space reserved before the call
global caller
caller:
    sub  rsp, 32            ; shadow space, required by the Windows x64 ABI
    mov  rcx, 42               ; first integer argument register on Windows x64 is rcx, not rdi
    call some_function
    add  rsp, 32
    ret
```

## Windows x64 vs SysV AMD64: Key Differences

| Aspect | SysV AMD64 (Linux/macOS) | Windows x64 |
|---|---|---|
| Integer arg registers | rdi, rsi, rdx, rcx, r8, r9 | rcx, rdx, r8, r9 |
| Shadow space | none (has a 128-byte red zone instead) | 32 bytes, caller-allocated |
| Red zone | 128 bytes below rsp (leaf functions) | none |
| Callee-saved registers | rbx, rbp, r12-r15 | rbx, rbp, rdi, rsi, r12-r15 (note: rdi/rsi ARE callee-saved here) |

## Never Assume SysV Conventions Apply on Windows

Code ported from a SysV AMD64 asm file to a Windows x64 build needs a full ABI review, not just a register renaming — the shadow-space requirement, the different callee-saved set (rdi/rsi are callee-saved on Windows but caller-saved on SysV), and the absence of a red zone are all easy to miss in a naive port.

## See Also

- [abi-red-zone](abi-red-zone.md) - The SysV-specific concept Windows x64 replaces with shadow space
- [abi-sysv-amd64-args](abi-sysv-amd64-args.md) - The SysV argument convention this contrasts with
- [abi-callee-saved-regs](abi-callee-saved-regs.md) - Note the differing callee-saved set on Windows
