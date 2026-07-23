# interop-inline-asm-constraints

> Choose the GCC/Clang constraint letter that matches what the instruction actually requires, not just "r" out of habit

## Why It Matters

Extended asm constraints tell the compiler what kind of operand (general register, specific register, memory, immediate) an instruction needs. Using the generic `"r"` when an instruction actually requires a specific register (like the shift-count operand needing `cl`) either produces a compile error, or forces the compiler to insert extra moves to satisfy the real hardware requirement that the loose constraint didn't communicate.

## Bad

```c
/* C, x86-64, GCC/Clang - "r" doesn't tell the compiler that shl needs its count in cl specifically */
unsigned shift_left(unsigned value, unsigned count) {
    unsigned result;
    asm ("mov %1, %0\n\t"
         "shl %2, %0"          /* variable shift count must be in cl; "r" doesn't guarantee that */
         : "=r" (result)
         : "r" (value), "r" (count)   /* BUG: should constrain count to "c" */
    );
    return result;
}
```

## Good

```c
/* C, x86-64, GCC/Clang - "c" constrains count to cl/ecx/rcx, matching the hardware requirement */
unsigned shift_left(unsigned value, unsigned count) {
    unsigned result;
    asm ("mov %1, %0\n\t"
         "shl %%cl, %0"
         : "=r" (result)
         : "r" (value), "c" (count)
    );
    return result;
}
```

## Common Constraint Letters (x86-64, GCC/Clang)

| Constraint | Meaning |
|---|---|
| `r` | any general-purpose register |
| `m` | a memory operand |
| `i` | an immediate integer constant |
| `a`, `b`, `c`, `d` | specifically rax/rbx/rcx/rdx |
| `S`, `D` | specifically rsi/rdi |
| `x` | an SSE register (xmm0-xmm15) |
| `g` | general operand: register, memory, or immediate (compiler's choice) |
| `0`-`9` | must match the operand numbered N (forces the same register/location) |

## ARM64 Constraint Example

```c
/* C, ARM64, GCC/Clang */
unsigned pop_count(unsigned x) {
    unsigned result;
    asm ("cnt %0.8b, %1.8b" : "=w" (result) : "w" (x));  /* "w" = SIMD/FP register */
    return result;
}
```

## See Also

- [interop-extended-asm-basic](interop-extended-asm-basic.md) - Base extended asm structure these constraints fit into
- [interop-clobber-list-complete](interop-clobber-list-complete.md) - What to declare when a constraint alone isn't enough
- [reg-riscv-x-registers](reg-riscv-x-registers.md) - Understanding register roles referenced by constraints
