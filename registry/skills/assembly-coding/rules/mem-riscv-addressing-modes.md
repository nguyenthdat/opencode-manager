# mem-riscv-addressing-modes

> RISC-V load/store instructions only support base register + 12-bit signed immediate offset — compute scaled indices explicitly

## Why It Matters

RISC-V's base ISA deliberately keeps addressing modes minimal: every `lw`/`ld`/`sw`/`sd` (and byte/half variants) takes a single base register plus a 12-bit signed immediate. There is no register+register or register+scaled-register addressing at all, so any index scaling must be materialized into a register with a separate `slli`/`add` before the load.

## Bad (Assuming Scaled Addressing Exists)

```asm
# RISC-V - this is NOT valid RISC-V syntax; scaled-index addressing doesn't exist
.globl get_element
get_element:
    ld a0, (a0, a1, 3)   # INVALID: no such addressing mode on RISC-V
    ret
```

## Good

```asm
# RISC-V - compute the scaled offset explicitly, then load with base+0 offset
.globl get_element
get_element:
    slli t0, a1, 3        # t0 = i * 8
    add  a0, a0, t0        # a0 = arr + i*8
    ld   a0, 0(a0)          # load arr[i]
    ret
```

## Addressing Syntax

```
offset(base)     # address = base + offset  (offset: 12-bit signed immediate, -2048..2047)
```

```asm
# RISC-V examples
lw  a0, 0(a1)      # load word at [a1]
lw  a0, 16(a1)     # load word at [a1 + 16]
sd  a0, -8(sp)      # store doubleword at [sp - 8]
```

## Offsets Beyond 12 Bits

When an offset exceeds the ±2048 range, materialize it into a register first (the assembler's `li` pseudo-instruction handles this transparently for large constants):

```asm
# RISC-V - large offset needs to be built up, then added
li   t0, 5000
add  t0, a0, t0
lw   a1, 0(t0)
```

## See Also

- [mem-x86-addressing-modes](mem-x86-addressing-modes.md) - x86-64's richer single-instruction addressing
- [mem-arm64-addressing-modes](mem-arm64-addressing-modes.md) - ARM64's shifted-register addressing
- [reg-riscv-x-registers](reg-riscv-x-registers.md) - Register naming used in these examples
