# doc-abi-assumption-comment

> State which calling convention, OS, and syntax a file assumes in a comment at the very top of the file

## Why It Matters

An assembly file's correctness depends on assumptions that are invisible from the code itself: which ABI it was written against (SysV vs Windows x64 vs AAPCS64), which OS-specific conventions apply (syscall numbers, symbol prefix), and which assembler/syntax it targets (GAS/AT&T vs NASM/Intel). Without a header comment stating these, a maintainer porting or reusing the file has to reverse-engineer the assumptions from register usage patterns — slow, and easy to get wrong.

## Bad

```asm
# checksum.s - no indication of target ABI, OS, or assembler at all
.global compute_checksum
compute_checksum:
    ret
```

## Good

```asm
# checksum.s
# Target: x86-64, Linux, System V AMD64 ABI, GNU assembler (GAS), AT&T syntax
# Assumes: little-endian, PIC/PIE build (-fPIC), no red-zone reliance in non-leaf paths
#
# uint32_t compute_checksum(const uint8_t *data, size_t len)
.global compute_checksum
compute_checksum:
    ret
```

## For Files Supporting Multiple Targets via Conditionals

```asm
# checksum.s
# Portable across x86-64 (SysV) and ARM64 (AAPCS64); target selected via preprocessor macros.
# Both variants assume little-endian and a PIC/PIE build.
#if defined(__x86_64__)
    .global compute_checksum
    compute_checksum:
        ret
#elif defined(__aarch64__)
    .global compute_checksum
    compute_checksum:
        ret
#endif
```

## What to Include

- Target ISA and, if relevant, microarchitecture requirements (e.g. "requires AVX2")
- Calling convention / ABI name
- OS (where it affects syscalls, symbol prefixing, or section conventions)
- Assembler and syntax (GAS/AT&T, NASM/Intel, etc.)
- Any load-bearing assumption not obvious from the code (endianness, PIC requirement, alignment guarantees the caller must provide)

## See Also

- [doc-entry-register-contract](doc-entry-register-contract.md) - Per-routine documentation this file-level comment complements
- [name-file-per-arch-suffix](name-file-per-arch-suffix.md) - Naming files so the target is also visible from the filename
- [mem-endianness-explicit](mem-endianness-explicit.md) - One of the assumptions worth stating explicitly
