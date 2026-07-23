# abi-syscall-convention

> A direct Linux syscall uses a different register mapping and instruction than a normal SysV function call

## Why It Matters

Issuing a raw `syscall` on Linux x86-64 does not follow the SysV AMD64 function-call ABI: the syscall number goes in `rax`, arguments shift into `rdi, rsi, rdx, r10, r8, r9` (note: `r10` replaces `rcx`, because `syscall` itself clobbers `rcx` and `r11`), and the call is made with the `syscall` instruction, not `call`. Using function-call register conventions for a syscall silently passes garbage arguments to the kernel.

## Bad

```asm
# x86-64 AT&T, Linux - wrong: using rcx as the 4th syscall arg like a normal call
.global write_stdout
write_stdout:
    mov  $1, %rax          # sys_write
    mov  $1, %rdi           # fd = stdout
    # rsi = buf, rdx = len already set by caller
    mov  %rcx, %r8          # BUG: 4th syscall arg register is r10, not rcx
    syscall
    ret
```

## Good

```asm
# x86-64 AT&T, Linux - sys_write(fd, buf, len)
# syscall arg registers: rdi, rsi, rdx, r10, r8, r9 ; number in rax ; result in rax
.global write_stdout
write_stdout:
    mov  $1, %rax           # __NR_write
    mov  $1, %rdi           # fd
    # rsi = buf (arg2), rdx = len (arg3) already correct from the C call convention
    syscall
    ret                      # rax now holds bytes written (or -errno)
```

## Registers Clobbered by `syscall`

The `syscall` instruction itself destroys `rcx` (holds the return address internally) and `r11` (holds saved flags); never rely on either surviving a `syscall`.

## ARM64 (Linux) Equivalent

```asm
// ARM64, Linux - sys_write(fd, buf, len); number in x8; svc #0 traps to kernel
.global write_stdout
write_stdout:
    mov x8, #64            // __NR_write on arm64
    // x0=fd, x1=buf, x2=len already in place
    svc #0
    ret
```

## See Also

- [abi-sysv-amd64-args](abi-sysv-amd64-args.md) - The regular function-call convention this differs from
- [reg-flags-clobber-awareness](reg-flags-clobber-awareness.md) - Related register/flag clobber tracking
- [interop-plt-got-external-calls](interop-plt-got-external-calls.md) - Calling libc wrappers instead of raw syscalls
