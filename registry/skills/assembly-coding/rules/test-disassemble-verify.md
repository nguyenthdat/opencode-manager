# test-disassemble-verify

> Disassemble the assembled object file and read back the actual encoded instructions to confirm they match what you intended to write

## Why It Matters

The text you write and the bytes the assembler actually emits are not always identical in ways that matter — an ambiguous size, an unexpected instruction selection (the assembler picking a different encoding of the same mnemonic), or a directive that silently did something other than what you expected. Reading the disassembly closes the loop and confirms the object file actually contains what you think it does.

## Basic Workflow

```bash
# Assemble, then disassemble to inspect the actual encoded instructions
as -o checksum.o checksum.s
objdump -d checksum.o
```

```
checksum.o:     file format elf64-x86-64

Disassembly of section .text:

0000000000000000 <compute_checksum>:
   0:	31 c0                	xor    %eax,%eax
   2:	48 85 f6             	test   %rsi,%rsi
   5:	74 0d                	je     14 <compute_checksum+0x14>
   ...
```

## Comparing Against Intended Behavior

If a routine was meant to zero-extend a byte but the disassembly shows a plain byte `mov` instead of `movzbl`, that's caught right here, before it ever reaches a test:

```bash
objdump -d checksum.o | grep -A2 'read_flag>:'
# confirm the instruction is movzbl, not a bare byte mov
```

## Verifying Alignment and Padding

```bash
# Confirm a hot loop's entry label actually landed on the alignment boundary requested
objdump -d hotpath.o | grep -B1 '<hot_loop>:'
```

## Checking Relocations for PIC Correctness

```bash
# Confirm RIP-relative/GOT-relative relocations are present where expected (PIC correctness)
objdump -dr checksum.o | grep -i 'R_X86_64'
```

## See Also

- [test-golden-file-disasm](test-golden-file-disasm.md) - Snapshotting disassembly to catch future regressions
- [test-compare-compiler-output](test-compare-compiler-output.md) - Comparing against compiler-generated asm for the same logic
- [lint-objdump-cross-check](lint-objdump-cross-check.md) - Making this a routine part of the review process
