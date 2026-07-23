# proj-separate-text-data-bss

> Organize every file so code stays in `.text`, initialized data in `.data`/`.rodata`, and zero-initialized data in `.bss`, consistently across the project

## Why It Matters

Beyond the syntax-level directive rules (see `syntax-section-directives`), this is a project-wide organizational discipline: a codebase where some files put constants in `.data` (wasting file size on values that are actually read-only) while others correctly use `.rodata`, or where zero-initialized buffers sometimes land in `.data` instead of `.bss`, makes the codebase's binary size and memory layout unpredictable and harder to reason about as a whole.

## Bad (Inconsistent Across Files)

```asm
# file_a.s - correctly uses .bss for a zeroed buffer
.section .bss
buffer_a: .skip 4096
```

```asm
# file_b.s - inconsistently zero-initializes the same kind of buffer in .data, wasting file space
.section .data
buffer_b: .skip 4096     # BUG-ish: .skip in .data still allocates 4096 bytes in the file unnecessarily
```

## Good

```asm
# file_a.s and file_b.s - consistent convention across the whole project
.section .bss
buffer_a: .skip 4096
```

```asm
.section .bss
buffer_b: .skip 4096
```

## A Project-Level Checklist

- Is every constant that's never written after initialization in `.rodata`, not `.data`?
- Is every zero-initialized buffer in `.bss`, not `.data` with explicit zero bytes?
- Does every file's `.text` section contain only code, with no data directives accidentally left in the wrong section due to a missing section-switch directive?

## Verifying Section Sizes Match Expectations

```bash
# size reports the actual size of each section in the final binary -- a quick sanity check
size my_program
#    text    data     bss     dec     hex filename
#   12345     256    4096   16697    413f my_program
```

## See Also

- [syntax-section-directives](syntax-section-directives.md) - The directive-level mechanics this organizes
- [name-section-name-standard](name-section-name-standard.md) - Sticking to standard section names project-wide
- [proj-one-routine-per-file-large](proj-one-routine-per-file-large.md) - File organization at a finer grain
