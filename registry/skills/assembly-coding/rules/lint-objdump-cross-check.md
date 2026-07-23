# lint-objdump-cross-check

> Make disassembling and reviewing `objdump -d` output a routine part of reviewing any change to hand-written asm, not a one-off debugging step

## Why It Matters

Source-level review of an asm diff tells you what was *written*, but not necessarily what was *encoded* — an operand-size ambiguity resolved differently than intended, an unexpectedly large encoding, or a relocation type that doesn't match the PIC/PIE requirements can all slip through a source-only review. Treating a disassembly check as a standard review step (not just something reached for after a bug report) catches these earlier.

## Bad (Source-Only Review)

```bash
# Reviewer only reads the diff of checksum.s, never checks what it actually assembles to
git diff checksum.s
# looks fine... merged.
```

## Good

```bash
# Part of the standard review workflow: assemble, disassemble, and read the actual output
as -o checksum.o checksum.s
objdump -d checksum.o
```

```
checksum.o:     file format elf64-x86-64

0000000000000000 <compute_checksum>:
   0:	31 c0                	xor    %eax,%eax
   2:	48 85 f6             	test   %rsi,%rsi
   ...
```

## What to Specifically Check in the Disassembly

- Instruction selection matches intent (e.g. `movzbl` where zero-extension was intended, not a bare byte `mov`)
- No unexpectedly large/small encodings for what should be simple operations
- Relocations present where PIC/PIE addressing was intended (`objdump -dr`)
- Alignment/padding at loop entries and section boundaries matches expectations

## Making This a Repeatable, Low-Friction Step

```bash
# A small script wrapping the check, easy to run as part of a pre-commit hook or CI step
#!/bin/sh
set -e
as -o /tmp/check.o "$1"
objdump -d /tmp/check.o
```

## See Also

- [test-disassemble-verify](test-disassemble-verify.md) - The mechanics of disassembly review in more depth
- [test-golden-file-disasm](test-golden-file-disasm.md) - Automating this check as a CI regression test
- [lint-static-analyzer-compiler-asm](lint-static-analyzer-compiler-asm.md) - Comparing the disassembly against compiler-idiomatic output
