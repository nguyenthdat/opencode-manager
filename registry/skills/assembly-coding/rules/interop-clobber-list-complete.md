# interop-clobber-list-complete

> List every register the asm block modifies but doesn't declare as an output, including flags where relevant

## Why It Matters

The compiler assumes any register not listed as an output or clobber survives the asm block unchanged. If the block secretly modifies a register it didn't declare — even a scratch register used only internally — the compiler may keep a live C variable in that register across the block and read corrupted data afterward, a bug that appears only with certain optimization levels or register-allocation decisions.

## Bad

```c
/* C, x86-64, GCC/Clang - rcx is used as scratch inside the asm but not declared as clobbered */
long shift_count(long value, long shift) {
    long result;
    asm ("mov %1, %%rcx\n\t"      /* rcx used as scratch here */
         "mov %2, %0\n\t"
         "shl %%cl, %0"
         : "=r" (result)
         : "r" (shift), "r" (value)
         : /* BUG: missing "rcx" in the clobber list */
    );
    return result;
}
```

## Good

```c
/* C, x86-64, GCC/Clang - rcx and the flags register both declared as clobbered */
long shift_count(long value, long shift) {
    long result;
    asm ("mov %1, %%rcx\n\t"
         "mov %2, %0\n\t"
         "shl %%cl, %0"
         : "=r" (result)
         : "r" (shift), "r" (value)
         : "rcx", "cc"          /* "cc" = condition codes/flags, "rcx" = the scratch register */
    );
    return result;
}
```

## Special Clobber Names

| Clobber | Meaning |
|---|---|
| `"cc"` | the flags/condition-code register was modified |
| `"memory"` | the block reads/writes memory the compiler can't see through its operands |
| `"r0"`..`"r15"`/`"rax"` etc. | a specific general register was modified |

## Prefer Letting the Compiler Choose Scratch Registers

Where possible, declare a scratch value as an early-clobber output (`"=&r"`) instead of hardcoding a specific register name — this lets the register allocator pick a free register instead of forcing `rcx` and potentially causing extra spills:

```c
asm ("mov %2, %0\n\t"
     "shl %1, %0"
     : "=r" (result)
     : "c" (shift), "r" (value)   /* "c" constraint asks specifically for cl/rcx, the shift-count register */
);
```

## See Also

- [interop-extended-asm-basic](interop-extended-asm-basic.md) - The basic input/output/clobber syntax
- [interop-asm-memory-clobber](interop-asm-memory-clobber.md) - The memory clobber specifically
- [reg-flags-clobber-awareness](reg-flags-clobber-awareness.md) - Why flags need the same care in hand-written asm
