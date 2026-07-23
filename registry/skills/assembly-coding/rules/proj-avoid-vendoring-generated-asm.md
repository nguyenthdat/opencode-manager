# proj-avoid-vendoring-generated-asm

> Don't hand-edit compiler-generated assembly output in place of modifying its source; regenerate it instead

## Why It Matters

Assembly emitted by `gcc -S`/`clang -S` (or by a build system's intermediate representation) is a derived artifact — hand-patching that output directly, then checking the patched `.s` file into the repository as if it were hand-written source, disconnects the code from the actual C/C++ source that's supposed to produce it. Any future change to the "real" source silently has no effect, because the build now uses the stale, hand-patched derivative instead.

## Bad

```bash
# Generating asm, then hand-editing and committing the OUTPUT instead of fixing the source
gcc -O2 -S hot_loop.c -o hot_loop.s
# ... manually tweak hot_loop.s to fix a bug or add an optimization ...
git add hot_loop.s     # BUG: hot_loop.c no longer reflects what actually ships;
                          # future changes to hot_loop.c won't be reflected in the build at all
```

## Good

```bash
# Fix the actual source, and let the build regenerate the asm as an intermediate artifact
vim hot_loop.c              # make the fix here, in the real source
gcc -O2 -c hot_loop.c -o hot_loop.o   # asm is a transient intermediate, not committed
git add hot_loop.c
```

## If You Genuinely Need Hand-Written Asm, Write It as Its Own File

When compiler output truly isn't sufficient (a specific instruction sequence the compiler won't generate, an ABI requirement it can't express), write a deliberate, from-scratch, documented `.s` file as described throughout this skill — don't start from a compiler dump and patch it, since that origin story tends to leave behind confusing compiler artifacts (odd register choices, debug-info-related directives) that have nothing to do with the actual intent.

```asm
# hot_loop.s, x86-64 AT&T - a deliberately hand-written routine, documented and self-contained,
# NOT derived by patching a compiler's -S output
.global hot_loop
# int64_t hot_loop(int64_t *data, int64_t n) -- hand-optimized inner summation loop
hot_loop:
    ...
    ret
```

## See Also

- [test-compare-compiler-output](test-compare-compiler-output.md) - The legitimate use of compiler output: as a reference, not a starting template to patch
- [doc-algorithm-reference](doc-algorithm-reference.md) - Documenting a deliberately hand-written routine's origin and reasoning
- [anti-premature-hand-optimization](anti-premature-hand-optimization.md) - Related discipline around when hand-written asm is justified at all
