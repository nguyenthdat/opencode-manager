# interop-extended-asm-basic

> Use GCC/Clang extended `asm` with explicit input, output, and clobber lists rather than basic `asm("...")`

## Why It Matters

Basic asm (`asm("nop");`) tells the compiler nothing about what registers or memory the block touches, so the compiler cannot correctly schedule code around it — it just avoids reordering across the block entirely, which is both overly conservative and, for anything that actually reads or writes C variables, outright unsafe. Extended asm's input/output/clobber syntax gives the compiler exact information so it can allocate registers correctly and optimize around the block safely.

## Bad

```c
/* C, x86-64, GCC/Clang - basic asm gives the compiler no information about data flow */
int add_one(int x) {
    int result;
    asm("mov %0, %%eax; add $1, %%eax; mov %%eax, %1" : : : );  /* wrong: no operands declared */
    return result;  /* compiler has no idea 'result' was set, may optimize this away */
}
```

## Good

```c
/* C, x86-64, GCC/Clang - extended asm declares inputs, outputs, and clobbers explicitly */
int add_one(int x) {
    int result;
    asm ("mov %1, %0\n\t"
         "add $1, %0"
         : "=r" (result)   /* output */
         : "r" (x)          /* input */
         :                   /* no extra clobbers; the compiler tracks %0/%1 itself */
    );
    return result;
}
```

## Anatomy of Extended Asm

```
asm ( "assembly template"
    : output operands   (constraint (C variable), ...)
    : input operands    (constraint (C variable), ...)
    : clobbered registers/memory
);
```

`%0`, `%1`, ... refer to operands in the order they're listed (outputs first, then inputs); this indirection is what lets the compiler pick which actual register to allocate for each operand.

## ARM64 Equivalent

```c
/* C, ARM64, GCC/Clang */
int add_one(int x) {
    int result;
    asm ("add %w0, %w1, #1" : "=r" (result) : "r" (x));
    return result;
}
```

## See Also

- [interop-clobber-list-complete](interop-clobber-list-complete.md) - Getting the clobber list right
- [interop-inline-asm-constraints](interop-inline-asm-constraints.md) - Choosing the correct constraint letters
- [interop-asm-memory-clobber](interop-asm-memory-clobber.md) - The special "memory" clobber
