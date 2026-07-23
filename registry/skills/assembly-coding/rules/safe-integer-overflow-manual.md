# safe-integer-overflow-manual

> Explicitly check the overflow/carry flag after manual arithmetic where overflow is a real possibility, rather than trusting the raw result

## Why It Matters

Hardware arithmetic instructions silently wrap on overflow (two's-complement wraparound for signed, modulo-2^n for unsigned) and only report the fact via flags — nothing stops the program from continuing to use a wrapped, incorrect value unless the code explicitly tests for it. Manual arithmetic that skips this check reproduces exactly the class of bug that high-level languages' checked-arithmetic operators exist to prevent.

## Bad

```asm
# x86-64 AT&T - no overflow check on an addition that could legitimately overflow
.global add_amounts_wrong
add_amounts_wrong:
    # int64_t add_amounts(int64_t a, int64_t b) -- caller relies on this NOT silently wrapping
    lea  (%rdi,%rsi), %rax   # BUG: lea doesn't even set flags, and no check follows anyway
    ret
```

## Good

```asm
# x86-64 AT&T - explicit overflow check using the flags add() sets
.global add_amounts
add_amounts:
    mov  %rdi, %rax
    add  %rsi, %rax
    jo   .overflowed          # jo: jump if the overflow flag (signed overflow) is set
    ret
.overflowed:
    # handle the error condition explicitly -- e.g. set an error code, or trap
    ud2                        # illustrative: trap immediately on detected overflow
```

## Unsigned Overflow Uses the Carry Flag, Not the Overflow Flag

```asm
# x86-64 AT&T - unsigned addition overflow is signaled by CF, not OF
.global add_unsigned_amounts
add_unsigned_amounts:
    mov  %rdi, %rax
    add  %rsi, %rax
    jc   .overflowed           # jc: jump if carry flag set (unsigned overflow)
    ret
.overflowed:
    ud2
```

## Checked-Arithmetic Idioms Worth Recognizing

| Operation | Overflow flag to check |
|---|---|
| signed add/sub | OF (`jo`/`jno`) |
| unsigned add | CF (`jc`/`jnc`) |
| unsigned sub | CF (borrow) |
| multiply (`mul`/`imul`, some forms) | CF and OF together indicate the result didn't fit |

## See Also

- [ctrl-flags-after-arith](ctrl-flags-after-arith.md) - Full reference for which instructions set which flags
- [reg-movsx-sign-extend](reg-movsx-sign-extend.md) - Related signed-arithmetic correctness concern
- [test-unit-test-known-vectors](test-unit-test-known-vectors.md) - Testing the boundary values where overflow occurs
