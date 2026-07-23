# doc-frame-layout-comment

> Document the stack frame layout (offset-to-purpose mapping) as a comment whenever a routine uses hand-managed stack offsets

## Why It Matters

A routine that addresses several local variables as `-8(%rbp)`, `-16(%rbp)`, `-24(%rbp)` gives a reader no way to know what each offset represents without mentally simulating the whole routine. A frame-layout diagram in a comment turns that simulation into a lookup table, and makes it far harder to introduce an off-by-one or overlapping-offset bug during a later edit.

## Bad

```asm
# x86-64 AT&T - offsets with no explanation of what each one holds
.global parse_and_sum
parse_and_sum:
    push %rbp
    mov  %rsp, %rbp
    sub  $32, %rsp
    mov  %rdi, -8(%rbp)
    mov  %rsi, -16(%rbp)
    movq $0, -24(%rbp)
    # ...
    leave
    ret
```

## Good

```asm
# x86-64 AT&T
# Stack frame layout for parse_and_sum:
#   -8(%rbp)  : saved copy of buf   (rdi at entry)
#   -16(%rbp) : saved copy of len   (rsi at entry)
#   -24(%rbp) : running sum accumulator (int64_t, initialized to 0)
#   -32(%rbp) : loop index (int64_t, initialized to 0)
.global parse_and_sum
parse_and_sum:
    push %rbp
    mov  %rsp, %rbp
    sub  $32, %rsp
    mov  %rdi, -8(%rbp)
    mov  %rsi, -16(%rbp)
    movq $0, -24(%rbp)
    movq $0, -32(%rbp)
    # ...
    leave
    ret
```

## Using Named Offsets Instead of (or in Addition to) a Comment

For longer routines, pairing the comment with named `.equ` constants removes the need to re-derive an offset from the comment every time it's used:

```asm
.equ FRAME_BUF,   -8
.equ FRAME_LEN,   -16
.equ FRAME_SUM,   -24
.equ FRAME_INDEX, -32

.global parse_and_sum
parse_and_sum:
    push %rbp
    mov  %rsp, %rbp
    sub  $32, %rsp
    mov  %rdi, FRAME_BUF(%rbp)
    mov  %rsi, FRAME_LEN(%rbp)
    movq $0, FRAME_SUM(%rbp)
    movq $0, FRAME_INDEX(%rbp)
    leave
    ret
```

## See Also

- [anti-hardcoded-stack-offset](anti-hardcoded-stack-offset.md) - The anti-pattern this documentation practice prevents
- [syntax-equ-named-constants](syntax-equ-named-constants.md) - Named constants used for the offsets themselves
- [abi-stack-frame-prologue](abi-stack-frame-prologue.md) - The frame setup this layout describes
