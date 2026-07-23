# syntax-section-directives

> Place code, initialized data, and zero-initialized data in `.text`, `.data`, and `.bss` respectively via explicit section directives

## Why It Matters

The linker and loader map each section with different permissions and initialization behavior: `.text` is typically read+execute (and should never be writable), `.data` is read+write and takes up file space for its initial values, and `.bss` is read+write but occupies zero bytes in the file (the loader just zero-fills it at load time). Putting writable data in `.text`, or putial data that needs actual initial values in `.bss`, either fails outright or silently loses the initial values.

## Bad

```asm
# x86-64 AT&T - data mixed into .text with no section directive at all (defaults can vary/surprise)
.global get_greeting
message: .string "hi\n"   # BUG: ends up in whatever the current section is, possibly .text
get_greeting:
    lea message(%rip), %rax
    ret
```

## Good

```asm
# x86-64 AT&T - explicit sections for code and read-only data
.section .rodata
message: .string "hi\n"

.section .text
.global get_greeting
get_greeting:
    lea message(%rip), %rax
    ret
```

## .data vs .bss

```asm
# x86-64 AT&T - .data for values that need real initial content; .bss for zero-initialized storage
.section .data
initial_count: .quad 42     # takes 8 bytes in the file, initialized to 42

.section .bss
.align 8
scratch_buffer: .skip 4096   # takes 0 bytes in the file; zero-filled at load time
```

## Section Summary

| Section | Contents | Permissions | Takes file space? |
|---|---|---|---|
| `.text` | executable code | read + execute | yes |
| `.rodata` | read-only constants | read only | yes |
| `.data` | initialized read-write data | read + write | yes |
| `.bss` | zero-initialized read-write data | read + write | no |

## See Also

- [proj-separate-text-data-bss](proj-separate-text-data-bss.md) - Project-level organization around these sections
- [syntax-global-visibility](syntax-global-visibility.md) - Marking symbols visible across these sections
- [safe-nx-stack-no-exec](safe-nx-stack-no-exec.md) - Why `.text` permissions matter for security
