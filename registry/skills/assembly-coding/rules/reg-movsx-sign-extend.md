# reg-movsx-sign-extend

> Use `movsx`/`movsxd` to sign-extend a signed narrower value; never assume a plain load sign-extends

## Why It Matters

A signed byte or word value must have its sign bit replicated into all the higher bits of the destination register before it participates in wider signed arithmetic or comparisons. A plain `mov` (or the zero-extending `movzx`) will not do this, turning a negative small value into a large positive one in the wider register.

## Bad

```asm
# x86-64 AT&T - treats a signed byte as unsigned, corrupting negative values
.global widen_wrong
widen_wrong:
    movzbl (%rdi), %eax   # BUG: -1 (0xFF) becomes 255, not -1
    ret
```

## Good

```asm
# x86-64 AT&T - movsbl correctly sign-extends the signed byte
.global widen_signed_byte
widen_signed_byte:
    movsbl (%rdi), %eax   # 0xFF -> 0xFFFFFFFF (-1), correctly sign-extended
    ret
```

## Sign-Extension Instruction Reference

| Source | Dest | AT&T | Intel |
|---|---|---|---|
| 8-bit  | 32-bit | `movsbl` | `movsx eax, byte ptr [...]` |
| 8-bit  | 64-bit | `movsbq` | `movsx rax, byte ptr [...]` |
| 16-bit | 32-bit | `movswl` | `movsx eax, word ptr [...]` |
| 32-bit | 64-bit | `movslq` (a.k.a. `movsxd`) | `movsxd rax, dword ptr [...]` |

## The 32-to-64 Case Deserves Extra Care

Unlike zero-extension (where writing a 32-bit register auto-zero-extends to 64 bits), sign-extension from 32 to 64 bits is never implicit — you must always use `movslq`/`movsxd` explicitly when a signed 32-bit value needs to become a correct signed 64-bit value (e.g., a negative array index).

```asm
# x86-64 AT&T - sign-extend a 32-bit signed index before using it to address memory
.global get_at_signed_index
get_at_signed_index:
    movslq %esi, %rsi          # sign-extend index (esi) into rsi
    mov    (%rdi,%rsi,8), %rax
    ret
```

## ARM64 Equivalent

```asm
// ARM64 - sxtb/sxth/sxtw sign-extend explicitly
.global widen_signed_byte
widen_signed_byte:
    ldrsb w0, [x0]     // load signed byte, sign-extend into w0/x0
    ret
```

## See Also

- [reg-movzx-zero-extend](reg-movzx-zero-extend.md) - The zero-extending counterpart
- [reg-32bit-implicit-zero-x86-64](reg-32bit-implicit-zero-x86-64.md) - Why sign-extension has no implicit shortcut
- [safe-signed-division-truncation](safe-signed-division-truncation.md) - Sign extension before signed division
