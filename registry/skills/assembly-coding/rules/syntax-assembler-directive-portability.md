# syntax-assembler-directive-portability

> Don't assume a directive that works in GAS, NASM, or MASM has an identical counterpart (or exists at all) in the others

## Why It Matters

Beyond the well-known GAS-vs-NASM mnemonic spelling differences, some directives have no equivalent in another assembler, or have a same-spelled directive with subtly different semantics (the `.align` byte-count-vs-power-of-two split is one well-known example). Treating "it assembles with assembler X" as proof of portability is a common source of build breakage when a project later adds a second target assembler or platform.

## Bad (Assuming Portability)

```asm
# x86-64 AT&T (GAS-specific) - assuming this also works verbatim under NASM
.section .text
.type my_func, @function     # GAS/ELF-specific directive; NASM has no direct equivalent syntax
my_func:
    ret
```

## Good

```asm
# x86-64 AT&T (GAS) - GAS-specific ELF metadata, clearly scoped to the GAS/ELF build path
.section .text
.type my_func, @function
.size my_func, . - my_func
my_func:
    ret
```

```asm
; x86-64 Intel (NASM) - equivalent visibility/type info expressed the NASM way
section .text
global my_func:function      ; NASM's colon-suffix syntax expresses the symbol type
my_func:
    ret
```

## Directives With No Cross-Assembler Equivalent

| Directive | Assembler | Purpose | Portable? |
|---|---|---|---|
| `.type`/`.size` | GAS (ELF targets) | Symbol type/size metadata for the linker | GAS/ELF-specific |
| `%define`/`%macro` | NASM | Preprocessor macros | NASM-specific (GAS has `.macro`/`.altmacro` instead) |
| `.cfi_startproc`/`.cfi_*` | GAS | DWARF call-frame-info for unwinding/debuggers | GAS-specific; other assemblers need different unwind metadata |
| `struc`/`endstruc` | NASM | Structure layout macros | NASM-specific |

## The Portable Approach

When a project genuinely must support multiple assemblers, isolate assembler-specific directives behind a small set of per-assembler include files or preprocessor guards, rather than trying to write one source file that happens to parse under both.

## See Also

- [syntax-nasm-vs-gas-directives](syntax-nasm-vs-gas-directives.md) - The common-case directive mapping
- [mem-align-directive](mem-align-directive.md) - A specific, well-known portability trap
- [doc-todo-fixme-tracked](doc-todo-fixme-tracked.md) - Tracking known non-portable shortcuts
