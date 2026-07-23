# perf-avoid-self-modifying-code

> Never write code that modifies its own instructions in memory; it stalls the instruction pipeline and defeats the instruction cache

## Why It Matters

CPUs aggressively cache and pipeline instruction fetch/decode assuming code doesn't change while executing. When code writes to a memory location that's also mapped as executable and about to be fetched, the CPU must detect the write (self-modifying-code detection logic exists specifically for this), flush the pipeline and instruction cache for the affected region, and refetch — a severe, hard-to-predict performance penalty, on top of being fragile and hard to debug.

## Bad

```asm
# x86-64 AT&T - patches an immediate operand in its own code at runtime: self-modifying code
.global apply_offset
apply_offset:
    # intends to change the "42" below to a caller-supplied value before executing it
    mov  %rdi, patch_target+1(%rip)   # BUG: writes into the instruction stream itself
patch_target:
    add  $42, %rax                     # this immediate gets overwritten right before running
    ret
```

## Good

```asm
# x86-64 AT&T - pass the value as data, never modify the instruction stream
.global apply_offset
apply_offset:
    # int64_t apply_offset(int64_t base, int64_t offset) { return base + offset; }
    mov  %rdi, %rax
    add  %rsi, %rax     # offset is a normal operand, not a patched immediate
    ret
```

## If You Need Runtime-Specialized Code, Use a Real JIT Approach

Legitimate cases (JIT compilers, runtime code generation) exist, but they require explicit, deliberate handling: write the new code to a separate writable-then-executable page, flush the instruction cache for that region using the correct platform API, and never write to memory that's concurrently being executed.

```c
/* C - the correct pattern: write to a fresh buffer, mark executable, THEN jump to it -
   never patch memory that's already mapped executable and potentially in-flight */
void *code = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
memcpy(code, generated_instructions, size);
mprotect(code, size, PROT_READ | PROT_EXEC);
__builtin___clear_cache(code, (char*)code + size);   /* required on ARM64; a no-op on x86-64 */
```

## See Also

- [safe-nx-stack-no-exec](safe-nx-stack-no-exec.md) - Related executable-memory-permission discipline
- [anti-self-modifying-code](anti-self-modifying-code.md) - The anti-pattern this rule names directly
- [proj-avoid-vendoring-generated-asm](proj-avoid-vendoring-generated-asm.md) - A different kind of "don't modify generated code" discipline
