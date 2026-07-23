# safe-stack-canary-respect

> Never overwrite, relocate, or bypass the compiler-inserted stack canary/protector value in a mixed C-and-asm stack frame

## Why It Matters

When C code compiled with stack-protector support (`-fstack-protector-strong` and similar) calls into or is called by hand-written asm sharing the same stack frame conventions, the canary value the compiler placed to detect buffer overflows must remain exactly where and what the compiler expects — asm that writes past its own intended bounds into the canary's slot either triggers a (correct) abort, or worse, if the asm deliberately or accidentally "fixes up" the canary, defeats the entire protection mechanism.

## Bad

```asm
# x86-64 AT&T - a routine assumes it can freely write past its declared locals into
# whatever is "just past" them, unaware that's where the compiler placed its canary
.global vulnerable_copy
vulnerable_copy:
    push %rbp
    mov  %rsp, %rbp
    sub  $16, %rsp
    # ... copies caller-controlled data into a 16-byte buffer with no bounds check ...
    # if the copy exceeds 16 bytes, it silently overwrites the canary slot instead of
    # being caught -- and depending on exactly what gets written, may even overwrite it
    # with a value that happens to match, defeating detection entirely
    leave
    ret
```

## Good

```asm
# x86-64 AT&T - bounds-checked copy that never comes close to any adjacent frame data
.global safe_copy
safe_copy:
    # void safe_copy(const uint8_t *src, size_t len) -- rejects anything over the true buffer size
    push %rbp
    mov  %rsp, %rbp
    sub  $16, %rsp
    cmp  $16, %rsi
    ja   .reject
    # ... safe, bounds-checked copy into the 16-byte buffer ...
    leave
    ret
.reject:
    xor  %eax, %eax
    leave
    ret
```

## Never Try to "Fix" a Canary Mismatch From Asm

If a stack-protector check in C-generated code detects corruption, the correct behavior is the program aborting — asm code should never attempt to intercept, silence, or repair a canary mismatch; doing so defeats a security mitigation that exists specifically to stop exploitation of the underlying bug.

## See Also

- [safe-stack-overflow-bounds](safe-stack-overflow-bounds.md) - The underlying bug class canaries are meant to catch
- [lint-checksec-binary](lint-checksec-binary.md) - Verifying stack-protector is actually enabled on the final binary
- [safe-return-address-integrity](safe-return-address-integrity.md) - The other classic stack-corruption target
