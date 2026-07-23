# name-constant-screaming-snake

> Name `.equ`/`%define` constants in SCREAMING_SNAKE_CASE, matching the convention for constants in C

## Why It Matters

SCREAMING_SNAKE_CASE is the near-universal convention for compile-time constants across C, C++, and most assembly style guides, which makes a constant instantly recognizable as a fixed value (as opposed to a label, register alias, or variable name) purely from its casing, without needing to check its definition.

## Bad

```asm
# x86-64 AT&T - constants that read like labels or variables, not fixed values
.equ maxRecordSize, 256
.equ status_flag_active, 0x8

.global check_size
check_size:
    cmp $maxRecordSize, %rdi
    ret
```

## Good

```asm
# x86-64 AT&T - SCREAMING_SNAKE_CASE immediately signals "this is a constant"
.equ MAX_RECORD_SIZE, 256
.equ STATUS_FLAG_ACTIVE, 0x8

.global check_size
check_size:
    cmp $MAX_RECORD_SIZE, %rdi
    ret
```

## NASM Equivalent

```asm
; x86-64 Intel (NASM)
%define MAX_RECORD_SIZE 256
%define STATUS_FLAG_ACTIVE 0x8
```

## Consistency With Shared C Headers

When a constant is also defined in a C header shared with the asm (see `proj-header-shared-constants`), keep the exact same name and casing in both places so a reader searching for the constant finds one canonical definition referenced from two files, not two independently-named constants that happen to hold the same value.

```c
/* shared_constants.h */
#define MAX_RECORD_SIZE 256
```

```asm
# constants.inc, included by both the C build (via a generation step) and the asm file
.equ MAX_RECORD_SIZE, 256   # MUST match shared_constants.h's MAX_RECORD_SIZE
```

## See Also

- [syntax-equ-named-constants](syntax-equ-named-constants.md) - Why named constants matter at all
- [proj-header-shared-constants](proj-header-shared-constants.md) - Keeping asm and C constant definitions in sync
- [anti-magic-number-offset](anti-magic-number-offset.md) - The anti-pattern this naming convention helps prevent
