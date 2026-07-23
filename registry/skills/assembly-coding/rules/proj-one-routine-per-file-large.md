# proj-one-routine-per-file-large

> Split large or loosely-related asm modules into one routine per file; keep small, tightly-related routines grouped together

## Why It Matters

A single large asm file mixing many unrelated routines is harder to navigate, harder to review in a diff (an unrelated routine's change pollutes the diff of the one you actually care about), and forces the whole file to be re-assembled whenever any one routine changes. Splitting appropriately-sized, logically-related groups into their own files keeps changes scoped and compile/incremental-build times lower.

## Bad (Everything in One File)

```
src/
  math_routines.s      # contains crc32, fast_sqrt, matrix_multiply, base64_encode,
                         # string_hash, and a dozen other unrelated routines, all in one 2000-line file
```

## Good (Grouped by Cohesive Purpose)

```
src/
  crc32.s               # CRC-32 checksum routine(s), self-contained
  fast_math.s            # fast_sqrt, fast_inverse_sqrt -- tightly related numeric tricks
  matrix_ops.s             # matrix_multiply, matrix_transpose -- related linear algebra routines
  encoding.s                # base64_encode, base64_decode -- related encoding routines
  string_hash.s              # string_hash and its variants, self-contained
```

## The Right Granularity Is "Cohesive Purpose," Not "One Function"

Splitting all the way down to one function per file often creates more overhead (more build-system entries, more header boilerplate) than it saves; group routines that are genuinely related (variants of the same algorithm, a small family of helpers used together) into one file, and split unrelated concerns into separate files.

## Signals a File Has Grown Too Large

- It contains routines serving genuinely unrelated purposes (a checksum routine next to a string-formatting routine)
- Multiple people frequently need to edit different parts of the same file for unrelated reasons, causing merge conflicts
- The file is difficult to summarize in one sentence

## See Also

- [proj-separate-text-data-bss](proj-separate-text-data-bss.md) - Section-level organization within a file
- [name-file-per-arch-suffix](name-file-per-arch-suffix.md) - Naming files once split appropriately
- [proj-per-arch-directory-layout](proj-per-arch-directory-layout.md) - Directory-level organization for multi-ISA projects
