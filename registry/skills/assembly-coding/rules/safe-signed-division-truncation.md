# safe-signed-division-truncation

> Sign-extend the dividend into the full double-width register (`cqo`/`cdq`/`cwd`) before a signed `idiv`, never leave the upper half as garbage or zero

## Why It Matters

x86's `idiv` divides a double-width dividend (`rdx:rax`, `edx:eax`, or `dx:ax`) by the divisor; for a signed division, the upper half must hold the sign extension of the lower half, not zero and not leftover garbage. Zero-extending a negative dividend (or leaving stale data in the upper half) produces a completely wrong quotient and remainder, since `idiv` interprets the full double-width value as the actual signed dividend.

## Bad

```asm
# x86-64 AT&T - zeroing rdx instead of sign-extending rax before a signed division
.global divide_wrong
divide_wrong:
    # int64_t divide_wrong(int64_t a, int64_t b) -- a may be negative
    xor  %edx, %edx      # BUG: zeroing rdx is correct for UNSIGNED division, wrong for signed
    idiv %rsi              # if a was negative, this now computes garbage
    ret
```

## Good

```asm
# x86-64 AT&T - cqo correctly sign-extends rax into rdx:rax before signed division
.global divide
divide:
    cqo                    # rdx:rax = sign-extend(rax) -- rdx becomes all-1s if rax was negative
    idiv %rsi
    ret
```

## Sign/Zero-Extension Instruction Reference for Division

| Width | Signed (sign-extend) | Unsigned (zero the upper half) |
|---|---|---|
| 16-bit (ax) | `cwd` (extends ax into dx:ax) | `xor %dx, %dx` |
| 32-bit (eax) | `cdq` (extends eax into edx:eax) | `xor %edx, %edx` |
| 64-bit (rax) | `cqo` (extends rax into rdx:rax) | `xor %edx, %edx` |

## Unsigned Division Uses `div`, Not `idiv`

```asm
# x86-64 AT&T - unsigned division: zero the upper half, use div (not idiv)
.global divide_unsigned
divide_unsigned:
    xor  %edx, %edx     # correct for UNSIGNED: upper half must be zero, not sign-extended
    div  %rsi              # div (not idiv) for unsigned division
    ret
```

Mixing these up — using `idiv` with a zeroed upper half, or `div` with a sign-extended one — produces silently wrong results for negative or large-unsigned inputs respectively.

## See Also

- [safe-division-by-zero-check](safe-division-by-zero-check.md) - The zero-divisor check that should precede this
- [reg-movsx-sign-extend](reg-movsx-sign-extend.md) - The general sign-extension rule this specializes
- [ctrl-signed-vs-unsigned-jcc](ctrl-signed-vs-unsigned-jcc.md) - The parallel signed/unsigned distinction in branching
