# anti-hardcoded-stack-offset

> Don't hardcode stack offsets without documenting the frame layout they depend on

## Why It Matters

An unexplained `-24(%rbp)` gives no future reader (including yourself, months later) any way to know what that offset represents or verify a later edit hasn't shifted it out from under an unrelated use elsewhere in the routine — this is one of the most common sources of subtle, hard-to-spot asm bugs after a routine is modified.

## Bad

```asm
# x86-64 AT&T - unexplained offsets, no frame-layout documentation anywhere
.global process
process:
    push %rbp
    mov  %rsp, %rbp
    sub  $32, %rsp
    mov  %rdi, -8(%rbp)
    mov  %rsi, -24(%rbp)   # why -24 and not -16? nothing explains the layout
    ...
    leave
    ret
```

## Good

```asm
# x86-64 AT&T
# Frame layout: -8(%rbp)=buf, -16(%rbp)=len, -24(%rbp)=accumulator
.equ FRAME_BUF, -8
.equ FRAME_LEN, -16
.equ FRAME_ACC, -24

.global process
process:
    push %rbp
    mov  %rsp, %rbp
    sub  $24, %rsp
    mov  %rdi, FRAME_BUF(%rbp)
    mov  %rsi, FRAME_LEN(%rbp)
    movq $0, FRAME_ACC(%rbp)
    ...
    leave
    ret
```

## The Failure Mode When a Later Edit Adds a Local

Unexplained offsets are especially dangerous when a routine is later extended with an additional local variable — without a documented layout, it's easy to pick an offset that overlaps one already in use, silently corrupting both:

```asm
# x86-64 AT&T - a later edit adds a "new" local at -24(%rbp), unaware the original author
# was already using -24(%rbp) for something else, since nothing documented the layout
.global process_extended
process_extended:
    push %rbp
    mov  %rsp, %rbp
    sub  $32, %rsp
    mov  %rdi, -8(%rbp)
    mov  %rsi, -24(%rbp)     # pre-existing use
    movq $0, -24(%rbp)         # BUG: a later "new" local collides with the line above
    leave
    ret
```

With the frame layout documented and named (as in the Good example), this collision would have been immediately visible: the second write would clearly reuse `FRAME_ACC`, not introduce a hidden new local at the same offset.

## See Also

- [doc-frame-layout-comment](doc-frame-layout-comment.md) - The full documentation practice this anti-pattern violates
- [syntax-equ-named-constants](syntax-equ-named-constants.md) - Named constants as the fix
- [safe-return-address-integrity](safe-return-address-integrity.md) - The severe failure mode an offset mistake can cause
- [mem-struct-field-padding](mem-struct-field-padding.md) - The analogous problem for struct field offsets, not just stack frames
