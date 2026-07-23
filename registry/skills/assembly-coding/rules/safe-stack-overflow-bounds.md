# safe-stack-overflow-bounds

> Never write to a stack address beyond the space you explicitly allocated for the current frame

## Why It Matters

Writing past the bounds of a hand-allocated stack frame corrupts whatever the adjacent stack memory holds — often the saved return address, a caller's saved register, or another local variable — producing corruption that may not crash immediately, making the actual write instruction hard to identify from the eventual failure.

## Bad

```asm
# x86-64 AT&T - allocates 16 bytes but writes to a 24-byte range
.global fill_buffer_wrong
fill_buffer_wrong:
    push %rbp
    mov  %rsp, %rbp
    sub  $16, %rsp          # only 16 bytes allocated
    movq $1, -8(%rbp)
    movq $2, -16(%rbp)
    movq $3, -24(%rbp)        # BUG: -24 is outside the 16-byte allocation, corrupts the caller's frame
    leave
    ret
```

## Good

```asm
# x86-64 AT&T - allocation size matches actual usage
.global fill_buffer
fill_buffer:
    push %rbp
    mov  %rsp, %rbp
    sub  $24, %rsp           # 24 bytes allocated, matching the three 8-byte writes below
    movq $1, -8(%rbp)
    movq $2, -16(%rbp)
    movq $3, -24(%rbp)
    leave
    ret
```

## Bounds Checking a Caller-Supplied Length

When copying caller-supplied data onto a fixed-size stack buffer, validate the length against the buffer's actual size before writing, rather than trusting the caller:

```asm
# x86-64 AT&T - reject an oversized copy instead of writing past the stack buffer
.global copy_to_stack_buffer
copy_to_stack_buffer:
    # void copy_to_stack_buffer(const uint8_t *src, size_t len) -- buffer is 64 bytes
    cmp  $64, %rsi
    ja   .reject          # length exceeds the buffer: refuse, don't silently overflow
    # ... safe to copy up to 64 bytes now ...
    ret
.reject:
    ret
```

## See Also

- [safe-stack-canary-respect](safe-stack-canary-respect.md) - The compiler-inserted defense this rule complements
- [mem-struct-field-padding](mem-struct-field-padding.md) - Related "know your actual layout" discipline
- [test-sanitizer-wrapper](test-sanitizer-wrapper.md) - ASan catches many stack-overflow bugs of this kind
