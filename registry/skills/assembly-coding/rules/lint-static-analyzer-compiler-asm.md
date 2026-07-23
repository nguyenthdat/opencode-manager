# lint-static-analyzer-compiler-asm

> Regularly compare hand-written asm against `gcc -S -O2`/`clang -S -O2` output for equivalent logic, as a lightweight, repeatable idiom-conformance check

## Why It Matters

There is no mature, widely-used static analyzer purpose-built for raw hand-written assembly the way there is for C/C++ (clang-tidy, cppcheck); the most practical, repeatable substitute is treating the optimizing compiler's own output for equivalent logic as a reference implementation to diff against, catching both missed idioms and outright suspicious divergences.

## Bad (No Systematic Idiom Check)

```
# Hand-written asm is reviewed only for correctness, never checked against what an
# optimizing compiler would produce for the same logic -- missed idioms go unnoticed indefinitely
```

## Good

```bash
# Generate the compiler's reference implementation for the same logic
cat > reference.c <<'CEOF'
uint32_t compute_checksum(const uint8_t *data, size_t len) {
    uint32_t sum = 0;
    for (size_t i = 0; i < len; i++) sum += data[i];
    return sum;
}
CEOF

gcc -O2 -S -fno-asynchronous-unwind-tables reference.c -o reference.s

# Then compare instruction selection, register usage, and structure against your hand-written version
diff <(objdump -d --no-show-raw-insn reference.o) <(objdump -d --no-show-raw-insn checksum.o)
```

## Making This a Recurring Practice, Not a One-Time Check

Re-run this comparison whenever the hand-written routine changes significantly, or when the project bumps its minimum-supported compiler version (newer compiler versions sometimes reveal new idioms worth adopting, or confirm an old hand-written trick is now something the compiler does automatically and could be simplified away).

## What Divergence Should Prompt

- **The compiler does something you didn't**: investigate whether it's a genuine missed optimization, or a deliberate difference your hand-written version has a real reason for.
- **You do something the compiler doesn't**: confirm your reasoning is still valid (e.g. an intrinsic-only SIMD idiom the toy C reference can't express) rather than assuming your version is automatically superior.

## See Also

- [test-compare-compiler-output](test-compare-compiler-output.md) - The one-time version of this comparison technique
- [test-golden-file-disasm](test-golden-file-disasm.md) - Snapshotting your own output over time as a complementary check
- [lint-objdump-cross-check](lint-objdump-cross-check.md) - The disassembly-reading skill this comparison depends on
