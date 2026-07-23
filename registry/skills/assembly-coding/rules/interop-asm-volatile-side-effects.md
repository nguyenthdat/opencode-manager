# interop-asm-volatile-side-effects

> Mark an extended asm block `volatile` whenever it has side effects the compiler can't infer from its output operands

## Why It Matters

Without `volatile`, the compiler is free to assume an asm block is a pure function of its inputs and may delete it entirely if the outputs appear unused, or hoist/sink it across other code during optimization. Any asm block that performs I/O, touches memory not listed in its operands, or must execute a specific number of times (not be merged/eliminated) needs `volatile` to tell the compiler these side effects are load-bearing.

## Bad

```c
/* C, x86-64, GCC/Clang - a hardware I/O write with no output; the compiler may eliminate this */
void set_status_led(int on) {
    asm ("out %0, $0x60" : : "a" (on));   /* BUG: no output operand, no volatile ->
                                              compiler may decide this call has no effect and drop it */
}
```

## Good

```c
/* C, x86-64, GCC/Clang - volatile tells the compiler this must execute exactly as written */
void set_status_led(int on) {
    asm volatile ("out %0, $0x60" : : "a" (on));
}
```

## When volatile Is NOT Needed

A pure computation with a real output operand the compiler can see being used is already safe without `volatile` — the compiler won't eliminate an instruction whose result is observably used:

```c
/* C, x86-64, GCC/Clang - pure computation, output is used, no volatile required */
int popcount32(unsigned x) {
    int result;
    asm ("popcnt %1, %0" : "=r" (result) : "r" (x));
    return result;
}
```

Adding `volatile` here anyway is not wrong, just unnecessary — the general rule of thumb is: if you're unsure whether the compiler could see all your side effects through the declared operands, add `volatile`.

## See Also

- [interop-extended-asm-basic](interop-extended-asm-basic.md) - The base extended-asm syntax this modifies
- [interop-asm-memory-clobber](interop-asm-memory-clobber.md) - The related "memory" clobber for hidden memory effects
- [safe-no-undocumented-flag-reliance](safe-no-undocumented-flag-reliance.md) - Related "don't hide effects from the tools" discipline
