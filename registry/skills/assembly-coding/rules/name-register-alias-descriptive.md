# name-register-alias-descriptive

> Alias registers to descriptive names with `.req` (GAS/ARM) or `#define` when a long routine reuses the same register for the same logical role throughout

## Why It Matters

A routine that uses `%r12` to hold "the current buffer position" for 80 lines reads far more clearly if every occurrence says `buf_pos` instead — readers no longer need to mentally substitute the register's role at every use, and a later refactor that frees up a different register only requires changing the alias definition, not every instruction.

## Bad

```asm
# x86-64 AT&T - raw register names throughout a long routine give no hint of their role
.global parse_record
parse_record:
    push %r12
    push %r13
    mov  %rdi, %r12
    mov  %rsi, %r13
    # ... 40 more lines referencing %r12 and %r13 with no indication of their purpose ...
    pop  %r13
    pop  %r12
    ret
```

## Good (GAS `.req` Aliasing on ARM64)

```asm
// ARM64 (GAS) - .req creates a readable alias for the duration of the routine
buf_ptr .req x19
rec_len .req x20

.global parse_record
parse_record:
    stp  buf_ptr, rec_len, [sp, #-16]!
    mov  buf_ptr, x0
    mov  rec_len, x1
    // ... uses buf_ptr / rec_len throughout, self-documenting ...
    ldp  buf_ptr, rec_len, [sp], #16
    ret

    .unreq buf_ptr        // release the alias when done, avoids leaking into later code
    .unreq rec_len
```

## x86-64 Equivalent via the C Preprocessor

GAS on x86 doesn't support `.req`; the common workaround is running the file through the C preprocessor and using `#define`:

```asm
# parse_record.S, x86-64 AT&T (note the capital .S extension enables cpp preprocessing)
#define buf_ptr %r12
#define rec_len %r13

.global parse_record
parse_record:
    push buf_ptr
    push rec_len
    mov  %rdi, buf_ptr
    mov  %rsi, rec_len
    # ... uses buf_ptr / rec_len throughout ...
    pop  rec_len
    pop  buf_ptr
    ret

#undef buf_ptr
#undef rec_len
```

## Don't Overuse This for Short Routines

A 5-line leaf function referencing a register twice doesn't need an alias — reserve this technique for routines long enough, or with roles unclear enough, that the alias genuinely improves readability rather than adding indirection for its own sake.

## See Also

- [name-label-snake-case](name-label-snake-case.md) - The parallel naming convention for labels
- [doc-entry-register-contract](doc-entry-register-contract.md) - Documenting register roles even without aliasing
- [reg-riscv-x-registers](reg-riscv-x-registers.md) - RISC-V's built-in ABI-name aliasing achieves something similar
