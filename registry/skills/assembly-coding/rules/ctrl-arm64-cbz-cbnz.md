# ctrl-arm64-cbz-cbnz

> Use `cbz`/`cbnz` for a zero-comparison branch on ARM64 instead of `cmp #0` followed by a conditional branch

## Why It Matters

`cbz`/`cbnz` ("compare and branch if zero/nonzero") fold a zero comparison and a conditional branch into a single instruction, without touching the NZCV flags at all. This is both more compact and leaves the flags register free for other logic (or simply avoids an unnecessary flags dependency for a reviewer to track).

## Bad

```asm
// ARM64 - two instructions and an unnecessary flags side effect for a simple zero check
.global find_first_zero_wrong
find_first_zero_wrong:
.loop:
    ldr  x1, [x0], #8
    cmp  x1, #0
    beq  .found
    b    .loop
.found:
    ret
```

## Good

```asm
// ARM64 - single instruction, no flags touched
.global find_first_zero
find_first_zero:
.loop:
    ldr  x1, [x0], #8
    cbz  x1, .found
    b    .loop
.found:
    ret
```

## cbnz for "not equal to zero"

```asm
// ARM64 - loop while a counter is still nonzero
.global countdown
countdown:
.loop:
    subs x0, x0, #1
    cbnz x0, .loop      // note: subs already sets flags too; cbnz here just avoids a second branch form
    ret
```

## Range Limitation

`cbz`/`cbnz` can only branch within ±1MB (a 19-bit signed word offset), same general class of limit as conditional branches — for longer-range jumps, fall back to `cmp`+`b.eq`/`b.ne` or restructure the control flow.

## No Direct x86-64 or RISC-V Equivalent

x86-64 always uses `test reg,reg` + `jz`/`jnz` (two instructions, see `ctrl-cmp-vs-test`); RISC-V's `beqz`/`bnez` pseudo-instructions (built on `beq`/`bne` against `zero`) achieve the same one-line readability, though at the hardware level they still compare two registers rather than fusing a compare-and-branch into one true instruction the way ARM64's `cbz` does.

## See Also

- [ctrl-cmp-vs-test](ctrl-cmp-vs-test.md) - The x86-64 equivalent two-instruction idiom
- [reg-arm64-zero-register](reg-arm64-zero-register.md) - The zero register this complements
- [ctrl-riscv-branch-immediate](ctrl-riscv-branch-immediate.md) - RISC-V's beqz/bnez pseudo-instructions
