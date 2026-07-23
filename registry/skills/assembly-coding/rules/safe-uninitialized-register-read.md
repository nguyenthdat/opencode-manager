# safe-uninitialized-register-read

> Never read a register or stack/heap location before it has been written by this routine or guaranteed initialized by the caller

## Why It Matters

An asm routine that reads a register the ABI doesn't guarantee holds a meaningful value at entry (anything beyond the declared arguments), or a local stack slot before writing to it, gets whatever garbage happened to be left there by a previous call, previous loop iteration, or uninitialized memory — a bug that is nondeterministic, often "works" during testing by coincidence, and is one of the hardest classes of bug to reproduce reliably.

## Bad

```asm
# x86-64 AT&T - reads a local before ever writing to it
.global compute_wrong
compute_wrong:
    push %rbp
    mov  %rsp, %rbp
    sub  $8, %rsp
    mov  -8(%rbp), %rax   # BUG: -8(%rbp) was never initialized; this is garbage
    add  %rdi, %rax
    leave
    ret
```

## Good

```asm
# x86-64 AT&T - explicitly initialize before any read
.global compute
compute:
    push %rbp
    mov  %rsp, %rbp
    sub  $8, %rsp
    movq $0, -8(%rbp)      # explicit initialization
    mov  -8(%rbp), %rax
    add  %rdi, %rax
    leave
    ret
```

## Reading a Register Beyond the ABI's Guarantee

```asm
# x86-64 AT&T - r10 is not part of the SysV argument-passing convention; its value at entry
# is whatever the caller last used it for (or garbage), never a documented "extra argument"
.global bad_extra_arg_read
bad_extra_arg_read:
    mov  %r10, %rax   # BUG: r10 is not defined to hold anything meaningful here per the ABI
    ret
```

## Verifying With a Debugger or Sanitizer

Tools like Valgrind's memcheck (for memory) and careful register-by-register review under gdb/lldb (see `test-gdb-register-inspect`) are effective at catching reads of values that were never actually initialized, especially when the garbage happens to be zero often enough to mask the bug in casual testing.

## See Also

- [ctrl-short-circuit-branches](ctrl-short-circuit-branches.md) - Validating inputs before use, a related discipline
- [abi-sysv-amd64-args](abi-sysv-amd64-args.md) - Which registers the ABI actually guarantees hold meaningful values
- [test-sanitizer-wrapper](test-sanitizer-wrapper.md) - Sanitizer-based detection of uninitialized reads
