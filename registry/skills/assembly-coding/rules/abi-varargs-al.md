# abi-varargs-al

> When calling a variadic function on SysV AMD64, set al to the number of vector (SSE) registers used

## Why It Matters

SysV AMD64's variadic-function convention requires the caller to load `%al` with the count of vector registers (`xmm0`-`xmm7`) used to pass floating-point arguments, so `va_arg`-style callees (like `printf`) know how many to save without inspecting the format string. Skipping this on a call to a variadic function is undefined behavior that often manifests as garbage floating-point output only when floating-point args are present.

## Bad

```asm
# x86-64 AT&T (SysV) - calling printf with a float arg, al not set
.section .rodata
fmt: .string "%d %f\n"
.section .text
.global report
report:
    # rdi = fmt, rsi = int arg, xmm0 = double arg
    lea   fmt(%rip), %rdi
    mov   $42, %rsi
    call  printf          # BUG: al should be 1 (one xmm reg used)
    ret
```

## Good

```asm
# x86-64 AT&T (SysV) - al set to the xmm register count
.section .rodata
fmt: .string "%d %f\n"
.section .text
.global report
report:
    lea   fmt(%rip), %rdi
    mov   $42, %rsi
    mov   $1, %al          # one vector register (xmm0) used
    call  printf
    ret
```

## No Floating-Point Args: al Is Zero

```asm
# x86-64 AT&T (SysV) - purely integer varargs call
.global report_int_only
report_int_only:
    lea   fmt2(%rip), %rdi
    mov   $7, %rsi
    xor   %eax, %eax       # al = 0: no vector registers used
    call  printf
    ret
```

## Portability Note

This `al` requirement is specific to SysV AMD64. ARM64 (AAPCS64) and RISC-V variadic calls do not have an equivalent register-count convention; consult each platform's variadic argument-passing rules (e.g., AAPCS64 varargs still uses the normal `x0`-`x7`/stack layout with no count register).

## See Also

- [abi-float-regs-separate](abi-float-regs-separate.md) - Why floating-point args use xmm/v/fa registers
- [abi-sysv-amd64-args](abi-sysv-amd64-args.md) - Base SysV argument convention
- [interop-c-callable-wrapper](interop-c-callable-wrapper.md) - Calling C library functions safely from asm
