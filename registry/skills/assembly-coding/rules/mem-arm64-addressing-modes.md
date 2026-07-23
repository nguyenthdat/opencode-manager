# mem-arm64-addressing-modes

> ARM64 load/store addressing is base+offset, base+register (optionally shifted), or pre/post-indexed — never a raw memory-to-memory operation

## Why It Matters

Unlike x86, ARM64 is a strict load/store architecture: arithmetic instructions never touch memory directly, only `ldr`/`str` (and their variants) do, and their addressing modes are more constrained (no combined scale+two-register-add in one form the way x86's `lea` provides, though shifted-register addressing gets close). Knowing the available forms avoids reaching for a multi-instruction sequence where one instruction suffices.

## Bad

```asm
// ARM64 - address computed manually instead of using shifted-register addressing
.global get_element
get_element:
    lsl x2, x1, #3
    add x2, x0, x2
    ldr x0, [x2]
    ret
```

## Good

```asm
// ARM64 - shifted-register addressing folds the scale into the load
.global get_element
get_element:
    ldr x0, [x0, x1, lsl #3]   // arr[i] for 8-byte elements
    ret
```

## Addressing Mode Reference

| Form | Syntax | Meaning |
|---|---|---|
| Base + immediate offset | `[x0, #16]` | `*(x0 + 16)` |
| Base + register | `[x0, x1]` | `*(x0 + x1)` |
| Base + shifted register | `[x0, x1, lsl #3]` | `*(x0 + x1*8)` |
| Pre-indexed | `[x0, #16]!` | `x0 += 16; *x0` |
| Post-indexed | `[x0], #16` | `*x0; x0 += 16` |

## Pre/Post-Indexing for Loop Traversal

```asm
// ARM64 - post-indexed load advances the pointer as part of the instruction
.global sum_array
sum_array:
    // x0 = ptr, x1 = count
    mov  x2, #0            // accumulator
.loop:
    cbz  x1, .done
    ldr  x3, [x0], #8       // load *x0, then x0 += 8
    add  x2, x2, x3
    sub  x1, x1, #1
    b    .loop
.done:
    mov  x0, x2
    ret
```

## See Also

- [mem-x86-addressing-modes](mem-x86-addressing-modes.md) - The x86-64 equivalent
- [mem-riscv-addressing-modes](mem-riscv-addressing-modes.md) - The more limited RISC-V equivalent
- [mem-arm64-adrp-adr](mem-arm64-adrp-adr.md) - PC-relative addressing on ARM64
