# reg-movzx-zero-extend

> Use `movzx` to zero-extend a narrower load into a wider register instead of assuming the upper bits are already clear

## Why It Matters

Loading an 8-bit or 16-bit value with a plain `mov` into `al`/`ax` leaves the upper bits of the enclosing 32/64-bit register **unchanged** (stale data from whatever was there before), which is a frequent source of bugs when that register is then used in a wider comparison or arithmetic op.

## Bad

```asm
# x86-64 AT&T - byte load leaves garbage in the upper 56 bits of rax
.global read_flag_wrong
read_flag_wrong:
    mov  $0xdeadbeef, %rax   # rax has nonzero upper bits from prior code, illustrative
    mov  (%rdi), %al          # only updates al; bits 8-63 of rax are untouched
    ret                        # caller reading full rax gets garbage, not 0/1
```

## Good

```asm
# x86-64 AT&T - movzbq zero-extends the byte into the full 64-bit register
.global read_flag
read_flag:
    movzbq (%rdi), %rax     # rax = zero-extended byte at [rdi]
    ret
```

## Zero-Extension Instruction Reference

| Source width | Dest width | x86-64 AT&T | x86-64 Intel |
|---|---|---|---|
| 8-bit | 32-bit | `movzbl` | `movzx eax, byte ptr [...]` |
| 8-bit | 64-bit | `movzbq` | `movzx rax, byte ptr [...]` |
| 16-bit | 32-bit | `movzwl` | `movzx eax, word ptr [...]` |
| 16-bit | 64-bit | `movzwq` | `movzx rax, word ptr [...]` |

Note: writing a 32-bit destination on x86-64 (e.g. `mov (%rdi), %eax`) already zero-extends into the full 64-bit register automatically — see `reg-32bit-implicit-zero-x86-64` — so `movzbl`/`movzwl` into a 32-bit register plus that implicit rule together zero-extend all the way to 64 bits.

## ARM64 Equivalent

```asm
// ARM64 - ldrb zero-extends a byte load into a 64-bit register by default
.global read_flag
read_flag:
    ldrb w0, [x0]     // zero-extends into x0 automatically
    ret
```

## See Also

- [reg-movsx-sign-extend](reg-movsx-sign-extend.md) - The sign-extending counterpart
- [reg-32bit-implicit-zero-x86-64](reg-32bit-implicit-zero-x86-64.md) - Implicit zero-extension on 32-bit writes
- [reg-partial-register-stall](reg-partial-register-stall.md) - Performance issue with partial register writes
