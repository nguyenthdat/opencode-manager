# doc-section-purpose-comment

> Comment the purpose of each `.data`/`.bss`/`.rodata` block, especially when a section holds several unrelated items

## Why It Matters

A data section listing several unrelated constants, buffers, and tables back-to-back gives no indication of what each one is for, or which routines depend on it, purely from the directive syntax. A short comment above each declaration (or above a logically-grouped block of them) turns a flat list of symbols into a navigable map of the file's data.

## Bad

```asm
# x86-64 AT&T - a wall of data with no explanation
.section .rodata
tbl1: .byte 0,1,1,2,1,2,2,3
mask: .quad 0xFF00FF00FF00FF00
msg:  .string "error\n"
```

## Good

```asm
# x86-64 AT&T - each item's purpose documented
.section .rodata

# Lookup table: population count for every possible 3-bit value (used by fast_popcount3)
popcount3_table: .byte 0,1,1,2,1,2,2,3

# Mask isolating the high byte of each 16-bit lane in a packed word (used by extract_high_bytes)
high_byte_mask: .quad 0xFF00FF00FF00FF00

# Error message printed by report_failure() on an unrecoverable parse error
error_message: .string "error\n"
```

## Grouping Related Data Under a Section Header Comment

```asm
# x86-64 AT&T
.section .rodata

# --- CRC-32 lookup tables (used by crc32_update) ---
crc_table:      .skip 1024
crc_table_end:

# --- Localized error message strings (indexed by error_message_table, used by report_error) ---
error_message_table: .quad msg_invalid_input, msg_out_of_memory, msg_timeout
msg_invalid_input:   .string "invalid input\n"
msg_out_of_memory:   .string "out of memory\n"
msg_timeout:         .string "operation timed out\n"
```

## See Also

- [syntax-section-directives](syntax-section-directives.md) - The sections these comments annotate
- [doc-abi-assumption-comment](doc-abi-assumption-comment.md) - File-level documentation this complements
- [proj-separate-text-data-bss](proj-separate-text-data-bss.md) - Organizing sections at the project level
