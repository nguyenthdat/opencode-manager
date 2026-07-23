# reg-flags-clobber-awareness

> Track exactly which instruction last set the flags you intend to branch on; many common instructions clobber flags as a side effect

## Why It Matters

On x86, the flags register (ZF, SF, CF, OF, PF) is a hidden piece of state that almost every arithmetic and logical instruction overwrites. Inserting what looks like an innocuous instruction (a `mov`, an address computation, a loop-counter update) between a flag-setting comparison and the branch that uses it silently changes which condition is actually tested.

## Bad

```asm
# x86-64 AT&T - lea between cmp and jcc looks safe but... actually lea doesn't touch flags,
# the real bug below is inserting an arithmetic op instead
.global check_and_branch
check_and_branch:
    cmp   %rsi, %rdi
    add   $1, %rdx        # BUG: this clobbers the flags cmp just set
    jl    .less             # now testing the flags from `add`, not `cmp`
    ret
.less:
    mov   $1, %rax
    ret
```

## Good

```asm
# x86-64 AT&T - keep any flag-clobbering instruction out of the way, or reorder it
.global check_and_branch
check_and_branch:
    add   $1, %rdx          # do unrelated work first
    cmp   %rsi, %rdi         # THEN set the flags you'll branch on
    jl    .less
    ret
.less:
    mov   $1, %rax
    ret
```

## Instructions That Do NOT Clobber Flags (Safe to Insert)

`mov`, `lea`, `push`, `pop`, `jmp`, and `call` (the call itself) leave the flags register unchanged, so they can safely sit between a `cmp`/`test` and the branch that consumes it. Almost everything else (`add`, `sub`, `and`, `or`, `xor`, `inc`, `dec`, shifts, `imul`/`mul` in some forms) does modify flags.

## RISC-V and ARM64 Differ Fundamentally

RISC-V branches (`beq`, `blt`, ...) compare two registers directly and have no flags register at all, sidestepping this entire class of bug. ARM64 has a flags register (NZCV) but only instructions with an explicit `s` suffix (`adds`, `subs`, `cmp`, `cmn`, `tst`) set it — plain `add`/`sub` do not, which is the opposite default from x86.

## See Also

- [ctrl-flags-after-arith](ctrl-flags-after-arith.md) - Full reference of which instructions set which flags
- [ctrl-cmp-vs-test](ctrl-cmp-vs-test.md) - Choosing the right flag-setting instruction
- [anti-unsynced-flags-across-calls](anti-unsynced-flags-across-calls.md) - Flags never survive a function call
