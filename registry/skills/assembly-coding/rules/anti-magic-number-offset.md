# anti-magic-number-offset

> Don't use unexplained magic-number offsets or immediates in place of named constants

## Why It Matters

A bare literal (`16(%rdi)`, `and $0x8, %eax`) tells a reader nothing about what it represents, and turns any future change (a struct gaining a field, a flag bit being reassigned) into an error-prone, easy-to-miss find-and-replace across every use site instead of a single definition update.

## Bad

```asm
# x86-64 AT&T - unexplained magic numbers throughout
.global process_record
process_record:
    mov  16(%rdi), %eax
    and  $0x8, %eax
    ret
```

## Good

```asm
# x86-64 AT&T - named constants make every use self-documenting
.equ RECORD_STATUS_OFFSET, 16
.equ STATUS_FLAG_ACTIVE,   0x8

.global process_record
process_record:
    mov  RECORD_STATUS_OFFSET(%rdi), %eax
    and  $STATUS_FLAG_ACTIVE, %eax
    ret
```

## Why Magic Numbers Are Worse in Asm Than in Higher-Level Code

In C, an unexplained `16` at least appears next to a named struct and field (`record->status`), giving a reader some context even without a comment. In asm, `16(%rdi)` carries none of that surrounding context at all — there's no field name, no type, nothing but a bare number, making the need for an explicit name even more pressing than in the equivalent C code.

## Magic Numbers Compound When They Appear More Than Once

The real danger isn't a single unexplained literal — it's the same literal appearing at several call sites, where a later layout change requires finding and updating every occurrence correctly:

```asm
# x86-64 AT&T - the same magic offset (16) appears three times; a future layout change
# requires finding and correctly updating every one of them
.global get_status
get_status:
    mov 16(%rdi), %eax
    ret

.global set_status
set_status:
    mov %esi, 16(%rdi)
    ret

.global clear_status
clear_status:
    movl $0, 16(%rdi)
    ret
```

```asm
# x86-64 AT&T - a single named constant; a layout change requires updating exactly one line
.equ RECORD_STATUS_OFFSET, 16

.global get_status
get_status:
    mov RECORD_STATUS_OFFSET(%rdi), %eax
    ret

.global set_status
set_status:
    mov %esi, RECORD_STATUS_OFFSET(%rdi)
    ret

.global clear_status
clear_status:
    movl $0, RECORD_STATUS_OFFSET(%rdi)
    ret
```

## See Also

- [syntax-equ-named-constants](syntax-equ-named-constants.md) - The full rule this anti-pattern violates
- [name-constant-screaming-snake](name-constant-screaming-snake.md) - Naming convention for the constants
- [mem-struct-field-padding](mem-struct-field-padding.md) - Why offsets specifically need careful, named handling
- [interop-struct-layout-agreement](interop-struct-layout-agreement.md) - Keeping named offsets synced with the real C struct
