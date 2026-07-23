# test-compare-compiler-output

> Diff hand-written asm against `gcc -S`/`clang -S` output for equivalent C source to sanity-check idiom conformance and catch missed optimizations

## Why It Matters

Compilers encode decades of accumulated knowledge about idiomatic, efficient instruction selection for a given target. Generating the compiler's own asm for the same logic (even if you don't ship the compiler's version) is a fast way to check whether your hand-written version is using reasonable idioms, missing an obvious instruction (like a scaled-index addressing mode you computed manually instead), or doing something the compiler considers unnecessary.

## Workflow

```bash
# Write the equivalent logic in C, then inspect what the compiler produces for it
cat > reference.c <<'CEOF'
long add_three(long a, long b, long c) {
    return a + b + c;
}
CEOF

gcc -O2 -S -fno-asynchronous-unwind-tables reference.c -o reference.s
cat reference.s
```

```asm
# reference.s (GCC -O2 output, x86-64 AT&T) - compare this idiom against your hand-written version
add_three:
    leaq (%rdi,%rsi), %rax
    addq %rdx, %rax
    ret
```

## What to Look For When Comparing

- Does the compiler fold arithmetic into `lea` the way `reg-lea-arithmetic-trick` describes, while your version uses separate `add` instructions?
- Does the compiler avoid a frame pointer for a leaf function (per `abi-leaf-function-omit-frame`) while your version always sets one up?
- Does the compiler pick a different (often smaller or faster) instruction for the same logical operation?

## This Is a Sanity Check, Not a Mandate

Hand-written asm sometimes deliberately diverges from what a compiler would emit — e.g. to use a specific instruction the compiler wouldn't choose (an intrinsic-only SIMD idiom), or to satisfy an ABI/interop requirement the toy C reference doesn't capture. Treat divergence as a prompt to double-check your reasoning, not an automatic bug.

## See Also

- [test-golden-file-disasm](test-golden-file-disasm.md) - Snapshotting your own asm's disassembly over time
- [lint-static-analyzer-compiler-asm](lint-static-analyzer-compiler-asm.md) - Making this comparison a routine lint step
- [reg-lea-arithmetic-trick](reg-lea-arithmetic-trick.md) - A specific idiom compilers commonly use
