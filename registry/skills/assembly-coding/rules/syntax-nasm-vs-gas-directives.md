# syntax-nasm-vs-gas-directives

> Learn the NASM-to-GAS directive mapping; the same concept is spelled differently in each assembler

## Why It Matters

NASM and GAS are both widely used for x86, but their directive names rarely match even when the underlying concept is identical, and copying a snippet from one into a file targeting the other produces confusing assembler errors about unknown directives rather than a clear syntax mismatch message.

## Bad

```asm
; Attempting to use a GAS directive inside a NASM source file
section .text
.global my_func      ; NASM error: unrecognized directive ".global" (NASM uses "global", no dot)
my_func:
    ret
```

## Good

```asm
; x86-64 Intel (NASM) - correct NASM directive spelling
section .text
global my_func
my_func:
    ret
```

```asm
# x86-64 AT&T (GAS) - correct GAS directive spelling
.section .text
.global my_func
my_func:
    ret
```

## Common Directive Mapping

| Concept | GAS | NASM |
|---|---|---|
| code section | `.text` | `section .text` |
| data section | `.section .data` | `section .data` |
| export symbol | `.global name` | `global name` |
| import external symbol | (implicit, or `.extern name`) | `extern name` |
| define byte/word/dword/qword | `.byte`/`.word`/`.long`/`.quad` | `db`/`dw`/`dd`/`dq` |
| named constant | `.equ NAME, value` | `%define NAME value` or `NAME equ value` |
| alignment | `.balign N` | `align N` |
| null-terminated string | `.asciz "..."` | `db "...", 0` |

## Cross-Checking When Porting

When porting a routine between the two assemblers, translate directive-by-directive rather than guessing — a quick reference table like the one above, or the target assembler's manual, avoids subtle semantic mismatches (e.g. GAS's target-dependent `.align` vs NASM's always-byte-count `align`).

## See Also

- [syntax-att-operand-order](syntax-att-operand-order.md) - The corresponding instruction-syntax difference
- [mem-align-directive](mem-align-directive.md) - The .align ambiguity called out in the table above
- [lint-ci-multi-assembler](lint-ci-multi-assembler.md) - Testing the same source across assemblers in CI
