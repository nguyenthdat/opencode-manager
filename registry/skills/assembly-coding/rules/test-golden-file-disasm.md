# test-golden-file-disasm

> Keep a checked-in "golden" disassembly snapshot of hot asm routines to catch unintended codegen changes from toolchain upgrades

## Why It Matters

An assembler or its optimization flags can change between versions in ways that alter the final encoding without changing the source at all (different instruction selection for a directive, different padding/alignment behavior). For a routine where exact instruction sequence matters (e.g. a hand-tuned hot loop, or code relying on a specific encoding for a security property), a golden-file diff surfaces that kind of silent drift immediately in CI, rather than relying on someone noticing a performance regression much later.

## Bad (No Snapshot, Silent Drift)

```
# CI just re-assembles and runs functional tests -- a subtly different (still "correct" but
# slower, or differently-padded) encoding would pass unnoticed
```

## Good

```bash
# Generate and check in a golden disassembly snapshot
as -o hot_loop.o hot_loop.s
objdump -d hot_loop.o > hot_loop.golden.txt
git add hot_loop.golden.txt
```

```bash
# ci_check_disasm.sh - CI step that fails the build if the disassembly drifted
as -o hot_loop.o hot_loop.s
objdump -d hot_loop.o > hot_loop.current.txt
diff hot_loop.golden.txt hot_loop.current.txt || {
    echo "Disassembly changed! Review whether this is expected, then update hot_loop.golden.txt";
    exit 1;
}
```

## Handling Expected, Intentional Changes

When a source change (or an intentional toolchain upgrade) legitimately changes the encoding, regenerate and re-commit the golden file as part of that same change, with a comment explaining why — this keeps the snapshot meaningful as an "unexpected change" detector rather than something people learn to ignore.

## What This Catches That Functional Tests Don't

- A missing `vzeroupper` that doesn't break correctness but costs performance
- Alignment padding silently changing due to a toolchain update
- An instruction substitution (same result, different latency/throughput characteristics)

## See Also

- [test-disassemble-verify](test-disassemble-verify.md) - The one-time disassembly review this snapshot approach automates
- [simd-vzeroupper-transition](simd-vzeroupper-transition.md) - An example of a regression this technique catches
- [test-cross-platform-ci](test-cross-platform-ci.md) - Running this check across every targeted ISA in CI
