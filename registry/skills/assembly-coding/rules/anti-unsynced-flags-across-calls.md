# anti-unsynced-flags-across-calls

> Don't assume the flags register survives a function call; the ABI makes no such guarantee

## Why It Matters

No mainstream calling convention promises that flags are preserved across a `call`/`bl`/`jal` — a callee is free to execute any arithmetic it needs internally, which clobbers flags as an unavoidable side effect. Code that sets flags, calls a function, and then branches on those "same" flags is reading whatever the callee last left behind, not the condition the caller actually intended to test.

## Bad

```asm
# x86-64 AT&T - branches on flags that a call in between has already clobbered
.global check_and_call_wrong
check_and_call_wrong:
    cmp  %rsi, %rdi
    call some_function      # BUG: this clobbers the flags cmp just set
    jl   .less                 # now testing some_function's leftover flags, not the cmp above
    ret
.less:
    mov  $1, %rax
    ret
```

## Good

```asm
# x86-64 AT&T - re-test after the call, or save the boolean result before calling
.global check_and_call
check_and_call:
    cmp  %rsi, %rdi
    setl %al                 # capture the comparison result BEFORE the call, as a value not flags
    movzbl %al, %r12d          # preserve it in a callee-saved-safe register across the call
    call some_function
    test %r12d, %r12d
    jnz  .less
    ret
.less:
    mov  $1, %rax
    ret
```

## Why This Is Easy to Miss in Review

The buggy version above still assembles cleanly and, worse, may even branch correctly some of the time — if `some_function` happens to leave flags in a state compatible with what the caller was hoping to test, the bug is invisible until a change to `some_function`'s internals (a different code path, a different optimization level, a different callee entirely once the code is refactored) shifts what its last flag-setting instruction was.

## ARM64 and RISC-V: The Same Rule, Different Mechanics

ARM64's NZCV flags register is equally unguaranteed across a `bl`; RISC-V sidesteps the entire category of bug by having no flags register at all, but the same underlying principle — never assume a *computed boolean result* survives a call unless it's explicitly preserved in a register or memory — still applies:

```asm
// ARM64 - the same mistake: branching on flags that bl has already clobbered
cmp x0, x1
bl  some_function      // clobbers NZCV
b.lt .less                // BUG: testing some_function's leftover flags, not the cmp above
```

## The General Fix: Materialize the Boolean Before Any Call

Whenever a comparison result needs to survive a function call, convert it into an explicit 0/1 value stored in a register or memory location before the call, exactly as shown in the corrected x86-64 example — never rely on the flags register itself surviving anything beyond the very next instruction that doesn't modify it.

## See Also

- [reg-flags-clobber-awareness](reg-flags-clobber-awareness.md) - The full rule this anti-pattern violates
- [abi-caller-saved-regs](abi-caller-saved-regs.md) - The related register-survival rule (flags are even less guaranteed)
- [ctrl-flags-after-arith](ctrl-flags-after-arith.md) - Which instructions set flags in the first place
- [ctrl-riscv-branch-immediate](ctrl-riscv-branch-immediate.md) - How RISC-V avoids this entire bug class by design
