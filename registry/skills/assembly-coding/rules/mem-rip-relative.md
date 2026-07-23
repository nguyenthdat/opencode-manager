# mem-rip-relative

> Address global data and constants RIP-relative on x86-64 so the code works correctly as position-independent code

## Why It Matters

Position-independent executables and shared libraries can be loaded at any base address, so absolute addresses baked into the instruction stream are wrong at runtime. RIP-relative addressing computes the address as an offset from the current instruction pointer, which the linker/loader can fix up correctly regardless of where the code ends up in memory.

## Bad

```asm
# x86-64 AT&T - absolute addressing breaks under PIE/PIC
.section .data
message: .string "hello\n"

.section .text
.global get_message_wrong
get_message_wrong:
    mov  $message, %rax    # BUG: absolute address, requires text relocations, breaks PIE
    ret
```

## Good

```asm
# x86-64 AT&T - RIP-relative addressing, correct under PIE/PIC
.section .rodata
message: .string "hello\n"

.section .text
.global get_message
get_message:
    lea  message(%rip), %rax   # position-independent: offset from the current rip
    ret
```

## Same Idea, Intel Syntax (NASM)

```asm
; x86-64 Intel (NASM) - default mode; NASM handles this with the `default rel` directive
default rel
section .rodata
message: db "hello", 10, 0

section .text
global get_message
get_message:
    lea rax, [message]     ; RIP-relative because of `default rel`
    ret
```

## Why This Matters for Shared Libraries Specifically

Every modern Linux distribution builds shared libraries (and increasingly, executables) as PIE by default; absolute-addressed asm will either fail to link with `-fPIC`/`-pie`, or silently produce a non-relocatable, insecure binary if the linker allows it through.

## See Also

- [syntax-pic-pie-default](syntax-pic-pie-default.md) - The broader PIC/PIE requirement this addressing serves
- [mem-arm64-adrp-adr](mem-arm64-adrp-adr.md) - The ARM64 equivalent (adrp+add)
- [interop-plt-got-external-calls](interop-plt-got-external-calls.md) - PIC-correct calls to external symbols
