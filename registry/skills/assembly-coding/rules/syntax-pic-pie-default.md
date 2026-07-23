# syntax-pic-pie-default

> Write position-independent code by default: no absolute addresses, RIP-relative/adrp-relative addressing, and calls to externals through the PLT/GOT

## Why It Matters

Modern Linux distributions build both shared libraries and ordinary executables as position-independent (PIE) by default, meaning the code can be loaded at a different base address every run (ASLR). Hand-written asm that hardcodes absolute addresses either fails to assemble/link under `-fPIC`/`-pie`, or — worse — links anyway via text relocations, which disables ASLR's security benefit for that binary and is often rejected outright by hardened build systems.

## Bad

```asm
# x86-64 AT&T - absolute addressing, incompatible with PIC/PIE
.section .data
counter: .quad 0

.section .text
.global increment_wrong
increment_wrong:
    incq counter          # BUG: assembles as an absolute address reference under non-PIC modes,
                           # and may require a text relocation that breaks PIE
    ret
```

## Good

```asm
# x86-64 AT&T - RIP-relative addressing, PIC/PIE-safe
.section .data
counter: .quad 0

.section .text
.global increment
increment:
    lea  counter(%rip), %rax
    incq (%rax)
    ret
```

## Building With PIC/PIE Explicitly

```bash
# Assemble and link as position-independent
gcc -fPIC -pie -c hotpath.s -o hotpath.o
gcc -fPIC -pie hotpath.o main.o -o app
```

## ARM64 Equivalent

```asm
// ARM64 - adrp+add is inherently PC-relative and PIC-safe
.section .data
counter: .quad 0

.section .text
.global increment
increment:
    adrp x0, counter
    add  x0, x0, :lo12:counter
    ldr  x1, [x0]
    add  x1, x1, #1
    str  x1, [x0]
    ret
```

## See Also

- [mem-rip-relative](mem-rip-relative.md) - The x86-64 addressing mode that makes this possible
- [mem-arm64-adrp-adr](mem-arm64-adrp-adr.md) - The ARM64 equivalent addressing idiom
- [interop-plt-got-external-calls](interop-plt-got-external-calls.md) - PIC-correct calls to external functions
- [lint-checksec-binary](lint-checksec-binary.md) - Verifying the final binary is actually PIE
