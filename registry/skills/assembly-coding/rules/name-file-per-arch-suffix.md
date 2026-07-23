# name-file-per-arch-suffix

> Suffix architecture-specific assembly source files with the target ISA (`_x86_64.s`, `_arm64.s`, `_riscv64.s`) so the build system and readers can tell them apart at a glance

## Why It Matters

A project that hand-writes the same routine for multiple ISAs needs an unambiguous way for both humans and the build system (Makefile/CMake glob rules, conditional compilation) to select the right file for the current target. A generic name like `checksum.s` gives no indication which architecture it targets, and risks two incompatible files silently colliding if the project later adds a second ISA.

## Bad

```
src/
  checksum.s        # which ISA is this for? unclear from the name alone
  checksum2.s         # even less clear -- a second attempt? a different arch? unknown
```

## Good

```
src/
  checksum_x86_64.s
  checksum_arm64.s
  checksum_riscv64.s
```

## Referencing the Right File From the Build System

```makefile
# Makefile - select the correct arch-specific source based on the target
ARCH := $(shell uname -m)
ifeq ($(ARCH),x86_64)
    ASM_SRC := src/checksum_x86_64.s
else ifeq ($(ARCH),aarch64)
    ASM_SRC := src/checksum_arm64.s
else ifeq ($(ARCH),riscv64)
    ASM_SRC := src/checksum_riscv64.s
endif
```

## Alternative: Directory-Per-Arch Layout

For larger projects with many per-arch files, a directory layout (`arch/x86_64/`, `arch/arm64/`) may read more cleanly than long filenames — see `proj-per-arch-directory-layout` for that variant; either is acceptable as long as it's applied consistently across the project.

## See Also

- [proj-per-arch-directory-layout](proj-per-arch-directory-layout.md) - The directory-based alternative to file suffixes
- [proj-makefile-integration](proj-makefile-integration.md) - Wiring per-arch sources into the build
- [interop-symbol-naming-underscore](interop-symbol-naming-underscore.md) - Another cross-platform naming concern
