# syntax-global-visibility

> Mark every symbol callable from outside the file with `.global`/`.globl`; leave internal-only symbols unmarked (local)

## Why It Matters

By default, a label defined in an assembly file is local to that file's translation unit — the linker cannot see it from another object file. Forgetting `.global` on a routine that another file needs to call produces an "undefined reference" link error; conversely, marking every internal helper `.global` needlessly pollutes the symbol table and can create accidental name collisions with other files' internal helpers.

## Bad

```asm
# x86-64 AT&T - forgot .global, so no other object file can call this
.section .text
compute_checksum:      # BUG: local by default, undefined reference at link time from other files
    xor %eax, %eax
    ret
```

## Good

```asm
# x86-64 AT&T - explicitly exported, and an internal helper deliberately left local
.section .text
.global compute_checksum
compute_checksum:
    call .internal_step   # local helper, not visible outside this file
    ret

.internal_step:            # not exported: no .global, and .L-prefixed to also drop it from the symtab
    xor %eax, %eax
    ret
```

## GAS vs NASM Spelling

```asm
# GAS (AT&T) accepts both spellings
.global compute_checksum
.globl  compute_checksum    # identical directive, alternate spelling
```

```asm
; NASM
global compute_checksum
```

## Visibility Beyond Global/Local

For shared libraries, consider also controlling ELF visibility (`.hidden`, `.protected`) to avoid unnecessarily exporting symbols that are `.global` only for intra-project linkage but should not be part of the library's public ABI:

```asm
# x86-64 AT&T - exported for intra-project linking, but hidden from the shared library's public ABI
.global compute_checksum
.hidden compute_checksum
```

## See Also

- [syntax-local-vs-global-symbols](syntax-local-vs-global-symbols.md) - Local label conventions (.L prefix)
- [name-avoid-reserved-mnemonics](name-avoid-reserved-mnemonics.md) - Choosing safe, collision-free symbol names
- [interop-name-mangling-c](interop-name-mangling-c.md) - Matching C-visible naming when linking against C
