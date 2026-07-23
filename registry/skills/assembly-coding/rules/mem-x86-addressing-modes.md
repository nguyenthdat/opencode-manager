# mem-x86-addressing-modes

> Use x86-64's base + index*scale + displacement addressing mode to fold pointer arithmetic into the memory operand itself

## Why It Matters

x86-64 memory operands can encode `disp(base, index, scale)` directly in the instruction, where `scale` is 1, 2, 4, or 8. Computing the same address in separate instructions wastes code size and a register, and obscures the fact that a single load/store instruction is doing the addressing work.

## Bad

```asm
# x86-64 AT&T - manually computes the address instead of folding it into the load
.global get_element
get_element:
    # int64_t get_element(int64_t *arr, int64_t i) -> arr[i]
    mov  %rsi, %rax
    shl  $3, %rax
    add  %rdi, %rax
    mov  (%rax), %rax
    ret
```

## Good

```asm
# x86-64 AT&T - base+index*scale folded directly into the load
.global get_element
get_element:
    mov  (%rdi,%rsi,8), %rax   # arr[i], scale=8 for int64_t
    ret
```

## Addressing Mode Syntax (AT&T)

```
disp(base, index, scale)   # address = base + index*scale + disp
```

| Example | Meaning |
|---|---|
| `(%rdi)` | `[rdi]` |
| `8(%rdi)` | `[rdi + 8]` |
| `(%rdi,%rsi)` | `[rdi + rsi]` |
| `(%rdi,%rsi,4)` | `[rdi + rsi*4]` |
| `-4(%rdi,%rsi,4)` | `[rdi + rsi*4 - 4]` |

## Same Instruction, Intel Syntax

```asm
; x86-64 Intel (NASM)
get_element:
    mov rax, [rdi + rsi*8]
    ret
```

## See Also

- [reg-lea-address-compute](reg-lea-address-compute.md) - Using the same addressing modes with `lea`
- [mem-array-index-scale](mem-array-index-scale.md) - Choosing the correct scale factor
- [mem-arm64-addressing-modes](mem-arm64-addressing-modes.md) - The ARM64 equivalent (no scaled index in one op)
- [syntax-att-operand-order](syntax-att-operand-order.md) - AT&T vs Intel syntax differences
