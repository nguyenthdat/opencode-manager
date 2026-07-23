# anti-assume-register-allocation

> Don't assume a specific register holds a particular value without checking the actual calling convention that applies

## Why It Matters

Register roles are entirely convention-defined, not something the hardware enforces on your behalf — assuming "the first argument is always in rdi" without checking whether the code in question is following SysV AMD64 (true there), Windows x64 (false — it's rcx), or a raw syscall convention (also false) produces code that reads a garbage or unrelated register.

## Bad

```asm
# x86-64 AT&T - assumes SysV register roles without checking which convention actually applies
.global handler
handler:
    mov %rdi, %rax   # BUG if this is actually compiled/linked as part of a Windows x64 build,
    ret                 # where the first integer argument is in rcx, not rdi
```

## Good

```asm
# x86-64 AT&T - convention explicitly stated and followed correctly for the target
# Target: Linux, System V AMD64 ABI (see doc-abi-assumption-comment)
.global handler
handler:
    mov %rdi, %rax    # correct: rdi is arg1 under SysV AMD64
    ret
```

## Also Watch For: Assuming a Register Is Free Scratch Space

A related version of this mistake is assuming an arbitrary register (`r10`, `r11`) is "safe" scratch space without checking the ABI or the `syscall` instruction's own clobber list:

```asm
# x86-64 AT&T, Linux - r11 is clobbered by `syscall` itself; using it to hold a value ACROSS a syscall is a bug
.global read_wrapper_wrong
read_wrapper_wrong:
    mov  %rdi, %r11    # BUG: r11 is about to be destroyed by the syscall instruction below
    mov  $0, %rax
    syscall
    mov  %r11, %rdi     # r11 no longer holds what was stored -- it was clobbered by syscall
    ret
```

## The Fix Is Always the Same: Check the Actual Convention in Force

Before writing a register read/write in a routine, identify which convention governs that specific instruction sequence — a normal function call (SysV/AAPCS64/RISC-V per target), a raw syscall (a different register mapping again), or a vendor-specific convention (Windows x64) — and verify against that convention's actual specification, not against habit carried over from a different ISA or a different kind of call.

## See Also

- [doc-abi-assumption-comment](doc-abi-assumption-comment.md) - Stating the assumed convention explicitly
- [safe-shadow-space-windows](safe-shadow-space-windows.md) - A concrete case where SysV assumptions break on Windows
- [abi-sysv-amd64-args](abi-sysv-amd64-args.md) - The convention this anti-pattern is often wrongly assumed universal
- [abi-syscall-convention](abi-syscall-convention.md) - The different register mapping raw syscalls actually use
- [anti-copy-paste-abi-mismatch](anti-copy-paste-abi-mismatch.md) - The cross-ISA version of this same mistake
