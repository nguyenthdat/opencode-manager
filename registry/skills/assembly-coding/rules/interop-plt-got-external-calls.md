# interop-plt-got-external-calls

> Call functions in another shared object through the PLT, and read external data through the GOT, when writing position-independent code

## Why It Matters

In a position-independent shared library, the address of an externally-defined function or global variable isn't known until load time. The Procedure Linkage Table (PLT) and Global Offset Table (GOT) are the standard indirection mechanisms the linker and loader use to resolve those addresses; hardcoding a direct call/address to an external symbol either fails to link under `-fPIC`/`-shared`, or requires a text relocation that breaks the security and performance benefits of PIC.

## Bad

```asm
# x86-64 AT&T - direct call assumes malloc's address is known at link time (fine for a static binary,
# broken for a PIC shared library referencing an external symbol from libc)
.global allocate_wrong
allocate_wrong:
    call malloc          # under -fPIC/-shared, this can require an unwanted text relocation
    ret
```

## Good

```asm
# x86-64 AT&T - let the assembler/linker route the call through the PLT automatically
.global allocate
allocate:
    call malloc@PLT       # explicit PLT indirection for a call to an external function
    ret
```

## Reading External Data Through the GOT

```asm
# x86-64 AT&T - external global variable, accessed via its GOT entry
.global read_errno
read_errno:
    mov  errno@GOTPCREL(%rip), %rax  # rax = address of the GOT slot holding errno's real address
    mov  (%rax), %rax                  # dereference the GOT slot to get errno's actual address
    mov  (%rax), %eax                   # now dereference that to get errno's value
    ret
```

## In Practice, the Compiler/Assembler Often Handles This For You

When compiling C with `-fPIC`, GCC/Clang automatically emit `@PLT`/`@GOTPCREL` references for external calls and data; hand-written asm calling into libc or another shared object needs to do so explicitly, as shown above, or the resulting object may fail to link cleanly as part of a `-shared`/`-pie` build.

## See Also

- [syntax-pic-pie-default](syntax-pic-pie-default.md) - The broader PIC/PIE requirement this serves
- [mem-rip-relative](mem-rip-relative.md) - RIP-relative addressing, used for GOT-relative references too
- [interop-c-callable-wrapper](interop-c-callable-wrapper.md) - Calling C library functions from asm safely
