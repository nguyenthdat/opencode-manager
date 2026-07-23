# interop-asm-memory-clobber

> Add a `"memory"` clobber to any extended asm block that reads or writes memory the compiler cannot see through its declared operands

## Why It Matters

Without a `"memory"` clobber, the compiler assumes the asm block only touches the specific operands listed and is free to keep unrelated memory-backed values cached in registers across the block, or to reorder loads/stores around it. If the block actually writes to memory through a pointer (rather than through a declared output operand), or performs an operation with global memory-ordering implications (like an atomic operation or a syscall), skipping this clobber lets the compiler's optimizer see stale data.

## Bad

```c
/* C, x86-64, GCC/Clang - writes through a raw pointer, but doesn't tell the compiler memory changed */
void zero_buffer(char *buf, long len) {
    asm ("rep stosb"
         : "+D" (buf), "+c" (len)
         : "a" (0)
         /* BUG: missing "memory" -- compiler may not realize *buf..buf+len was written */
    );
}
```

## Good

```c
/* C, x86-64, GCC/Clang - "memory" clobber tells the compiler all of memory may have changed */
void zero_buffer(char *buf, long len) {
    asm ("rep stosb"
         : "+D" (buf), "+c" (len)
         : "a" (0)
         : "memory"
    );
}
```

## When "memory" Is Required

- The asm writes through a pointer operand rather than a declared output
- The asm calls into other code (a syscall, another function) that may touch arbitrary memory
- The asm implements a memory barrier / fence and must prevent the compiler from reordering loads/stores across it
- The asm reads global state that another thread might have modified (roughly analogous to a C11 atomic with acquire semantics)

## When It's Safe to Omit

A pure computation over register-only operands, with no pointer dereferences and no calls, does not need `"memory"`:

```c
/* C, x86-64, GCC/Clang - pure register computation, no memory touched */
asm ("popcnt %1, %0" : "=r" (result) : "r" (x));
```

## See Also

- [interop-clobber-list-complete](interop-clobber-list-complete.md) - Register clobbers, the complementary concern
- [interop-asm-volatile-side-effects](interop-asm-volatile-side-effects.md) - The related volatile keyword
- [perf-avoid-lock-prefix-uncontended](perf-avoid-lock-prefix-uncontended.md) - Memory-ordering-sensitive operations
