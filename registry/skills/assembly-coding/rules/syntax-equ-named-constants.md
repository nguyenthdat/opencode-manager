# syntax-equ-named-constants

> Name magic numbers with `.equ` (GAS), `%define`/`equ` (NASM), or `#define` (C headers shared with asm) instead of embedding raw literals

## Why It Matters

A bare numeric literal scattered through a routine (a buffer size, a struct offset, a syscall number, a bit-flag mask) gives the reader no idea what it represents and turns any future change into a error-prone find-and-replace across every occurrence. A named constant documents intent once and updates every use site from a single definition.

## Bad

```asm
# x86-64 AT&T - unexplained magic numbers throughout
.global process_record
process_record:
    mov  16(%rdi), %eax    # what's at offset 16?
    and  $0x8, %eax          # what does bit 3 mean?
    cmp  $256, %esi           # why 256?
    ja   .too_large
    ret
.too_large:
    mov  $-1, %eax
    ret
```

## Good

```asm
# x86-64 AT&T - named constants make every use self-documenting
.equ RECORD_STATUS_OFFSET, 16
.equ STATUS_FLAG_ACTIVE,   0x8
.equ MAX_RECORD_SIZE,      256

.global process_record
process_record:
    mov  RECORD_STATUS_OFFSET(%rdi), %eax
    and  $STATUS_FLAG_ACTIVE, %eax
    cmp  $MAX_RECORD_SIZE, %esi
    ja   .too_large
    ret
.too_large:
    mov  $-1, %eax
    ret
```

## NASM Equivalent

```asm
; x86-64 Intel (NASM)
%define RECORD_STATUS_OFFSET 16
%define STATUS_FLAG_ACTIVE   0x8
%define MAX_RECORD_SIZE      256

global process_record
process_record:
    mov  eax, [rdi + RECORD_STATUS_OFFSET]
    and  eax, STATUS_FLAG_ACTIVE
    cmp  esi, MAX_RECORD_SIZE
    ja   .too_large
    ret
.too_large:
    mov  eax, -1
    ret
```

## Sharing Constants With C

When the same offsets/flags are used from both C and asm, generate them from one source of truth rather than maintaining two copies — see `proj-header-shared-constants` for the pattern.

## See Also

- [mem-struct-field-padding](mem-struct-field-padding.md) - Struct offsets that benefit most from named constants
- [proj-header-shared-constants](proj-header-shared-constants.md) - Sharing constants between C and asm
- [anti-magic-number-offset](anti-magic-number-offset.md) - The anti-pattern this rule prevents
