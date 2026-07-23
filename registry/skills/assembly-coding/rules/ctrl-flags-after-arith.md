# ctrl-flags-after-arith

> Know exactly which flags each instruction sets before branching on them

## Why It Matters

Conditional branches on x86 test specific combinations of ZF, SF, CF, OF, and PF — not the raw arithmetic result. Choosing the wrong condition code, or assuming an instruction sets a flag it does not, produces a branch that looks plausible in the source but is wrong for certain inputs (often only the edge cases: zero, negative, or overflow).

## Bad

```asm
# x86-64 AT&T - inc/dec do NOT update the carry flag (CF); using jc/jnc after them is a bug
.global check_overflow_wrong
check_overflow_wrong:
    mov  $0xFFFFFFFFFFFFFFFF, %rax
    inc  %rax               # wraps to 0, but CF is left UNCHANGED by inc
    jc   .overflowed          # BUG: this never fires, regardless of the wrap
    ret
.overflowed:
    mov  $1, %rax
    ret
```

## Good

```asm
# x86-64 AT&T - use add (which does set CF) to detect the wrap
.global check_overflow
check_overflow:
    mov  $0xFFFFFFFFFFFFFFFF, %rax
    add  $1, %rax             # add sets CF on unsigned overflow
    jc   .overflowed
    ret
.overflowed:
    mov  $1, %rax
    ret
```

## Flags Set by Common Instructions

| Instruction | ZF | SF | CF | OF |
|---|---|---|---|---|
| `add`/`sub` | yes | yes | yes | yes |
| `inc`/`dec` | yes | yes | **no** (CF unaffected) | yes |
| `and`/`or`/`xor` | yes | yes | cleared | cleared |
| `test`/`cmp` | yes | yes | yes | yes (like sub/and, non-destructive) |
| `shl`/`shr`/`sar` | yes | yes | yes (last bit shifted out) | only meaningful for 1-bit shifts |
| `mul`/`imul` | undefined | undefined | yes (overflow into high half) | yes |

## ARM64: Flags Are Opt-In

ARM64 only updates NZCV when you use the `s`-suffixed instruction form (`adds`, `subs`, `ands`) or `cmp`/`cmn`/`tst` — plain `add`/`sub` never touch flags, the opposite default from x86.

```asm
// ARM64 - must use adds, not add, to get flag updates for a branch afterward
adds x0, x0, x1
bvs  .overflowed     // branch if overflow flag set
```

## See Also

- [ctrl-cmp-vs-test](ctrl-cmp-vs-test.md) - Choosing between cmp and test
- [ctrl-signed-vs-unsigned-jcc](ctrl-signed-vs-unsigned-jcc.md) - Picking the right conditional jump
- [reg-flags-clobber-awareness](reg-flags-clobber-awareness.md) - Keeping flags alive between the setter and the branch
- [safe-integer-overflow-manual](safe-integer-overflow-manual.md) - Using these flags to check for overflow
