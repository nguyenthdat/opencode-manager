# abi-caller-saved-regs

> Assume caller-saved registers do not survive a `call`; save them yourself first if you need them after

## Why It Matters

Caller-saved (volatile) registers may be freely clobbered by any callee. If a value you need after a `call` lives in one of these registers, it is your responsibility as the caller to preserve it — the ABI gives the callee no obligation to do so.

## Bad

```asm
# x86-64 AT&T (SysV) - assumes rcx survives the call
.global compute
compute:
    mov  $10, %rcx
    call helper          # BUG: helper is free to clobber rcx (it's caller-saved)
    mov  %rcx, %rax       # may not be 10 anymore
    ret
```

## Good

```asm
# x86-64 AT&T (SysV) - preserve the value across the call explicitly
.global compute
compute:
    mov  $10, %rcx
    push %rcx
    call helper
    pop  %rcx
    mov  %rcx, %rax
    ret
```

Better still: keep the value in a callee-saved register (`rbx`, `r12`-`r15`) across the call instead of push/pop when the routine already sets up a frame.

## Caller-Saved Register Sets

| ISA | Caller-saved (volatile) registers |
|-----|------------------------------------|
| x86-64 SysV | rax, rcx, rdx, rsi, rdi, r8-r11, xmm0-xmm15 |
| ARM64 AAPCS64 | x0-x18, v0-v7/v16-v31 |
| RISC-V | a0-a7, t0-t6, ft0-ft11 |

## See Also

- [abi-callee-saved-regs](abi-callee-saved-regs.md) - The complementary non-volatile set
- [abi-return-value-regs](abi-return-value-regs.md) - rax/x0/a0 are caller-saved and hold results
- [anti-unsynced-flags-across-calls](anti-unsynced-flags-across-calls.md) - The equivalent trap with flags
