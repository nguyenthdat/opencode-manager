# reg-arm64-zero-register

> Use `xzr`/`wzr` when you need a hardwired zero operand on ARM64, and note that `sp` occupies that same encoding in load/store contexts

## Why It Matters

ARM64 dedicates encoding slot 31 to mean "zero register" (`xzr`/`wzr`) in most instruction contexts, giving you a zero source/discard-destination without loading a literal or spending a register. But that same encoding slot means the stack pointer (`sp`) in load/store base-register position — the two meanings are context-dependent, and confusing them is a real source of bugs when porting code.

## Bad

```asm
// ARM64 - intending to compare against zero, but reusing a register that holds garbage
.global is_zero_wrong
is_zero_wrong:
    mov  x1, #0        // extra instruction just to get a zero
    cmp  x0, x1
    cset x0, eq
    ret
```

## Good

```asm
// ARM64 - compare directly against the zero register, no setup instruction needed
.global is_zero
is_zero:
    cmp  x0, xzr
    cset x0, eq
    ret
```

## Discarding a Result

```asm
// ARM64 - write to xzr to discard a result you don't need (e.g. flags-only op)
subs xzr, x0, x1     // compute x0 - x1, set flags, discard the difference
```

## The sp/xzr Encoding Trap

```asm
// ARM64 - in most data-processing instructions, register 31 means xzr (zero)
add x0, x1, xzr        // x0 = x1 + 0

// but in load/store base-register position, register 31 means sp, NOT xzr
ldr x0, [sp, #16]       // this is "load from stack pointer + 16", not from xzr
```

Always check the specific instruction's encoding table in the ARM Architecture Reference Manual when register 31 appears in an unfamiliar instruction form.

## See Also

- [reg-xor-zero-idiom](reg-xor-zero-idiom.md) - The x86-64 equivalent trick
- [reg-riscv-zero-register](reg-riscv-zero-register.md) - RISC-V's analogous zero register
- [ctrl-arm64-cbz-cbnz](ctrl-arm64-cbz-cbnz.md) - Zero-comparison branches that avoid this entirely
