# proj-versioned-abi-comment

> Record the target ABI/OS/toolchain assumptions for the whole project in one place (README or a project-level doc comment), not just scattered per-file

## Why It Matters

Individual files documenting their own ABI assumptions (see `doc-abi-assumption-comment`) is necessary but not sufficient at the project level — a new contributor needs one place to learn "this project targets Linux x86-64 SysV and ARM64 AAPCS64, assembled with GAS, and does not support Windows" before diving into any individual file, rather than having to read every file's header comment to piece together the project's overall scope.

## Bad (No Project-Level Statement, Only Per-File Comments)

```
# A contributor has to open every .s file individually and cross-reference their
# headers to figure out which architectures/OSes the project actually supports.
```

## Good

```markdown
<!-- README.md excerpt -->
## Supported Platforms

This project's hand-written assembly targets:

- **x86-64 Linux** (System V AMD64 ABI, GNU assembler, AT&T syntax) — primary target
- **ARM64 Linux** (AAPCS64, GNU assembler) — secondary target, tested via CI on native runners
- **RISC-V64 Linux** (standard RVA22 calling convention) — experimental, tested via QEMU only

Windows and macOS are **not currently supported** for the assembly-optimized code paths;
those platforms fall back to the portable C implementation automatically (see `simd-fallback-scalar-path`).

All assembly assumes little-endian byte order and a PIC/PIE build.
```

## Keeping the Project-Level Statement in Sync

Treat this document the same way as any other part of the public contract: a change that adds or drops platform support must update this statement in the same commit, not as an afterthought — a stale platform list is worse than none, since it actively misleads.

## See Also

- [doc-abi-assumption-comment](doc-abi-assumption-comment.md) - The per-file version of this same discipline
- [test-cross-platform-ci](test-cross-platform-ci.md) - CI coverage that should match what this document claims
- [simd-fallback-scalar-path](simd-fallback-scalar-path.md) - The fallback behavior for unsupported platforms
