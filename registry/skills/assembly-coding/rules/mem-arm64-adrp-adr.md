# mem-arm64-adrp-adr

> Use `adrp`+`add` (page-relative) to reach a global symbol's address on ARM64, since a single instruction can't hold a full 64-bit address

## Why It Matters

ARM64 instructions are fixed 32-bit width, which cannot encode an arbitrary 64-bit immediate. `adrp` computes the address of the 4KB page containing a symbol (PC-relative, so it's PIC-safe), and a following `add` (or `ldr` with a `:lo12:` offset) fills in the low 12 bits — this two-instruction idiom is how ARM64 code reaches any static symbol, including in position-independent binaries.

## Bad

```asm
// ARM64 - trying to materialize a 64-bit absolute address in one instruction: not possible
.global get_message_wrong
get_message_wrong:
    mov  x0, message      // INVALID: mov immediate can't hold an arbitrary 64-bit label address
    ret
```

## Good

```asm
// ARM64 - the standard adrp+add idiom for reaching a static symbol
.section .rodata
message: .string "hello\n"

.section .text
.global get_message
get_message:
    adrp x0, message           // x0 = page address containing 'message'
    add  x0, x0, :lo12:message // x0 += low 12 bits of message's address within that page
    ret
```

## Loading Through the Symbol Directly

```asm
// ARM64 - loading a value stored at a global address, combining adrp with an offset load
.section .data
counter: .quad 0

.section .text
.global read_counter
read_counter:
    adrp x0, counter
    ldr  x0, [x0, :lo12:counter]
    ret
```

## Why Not Just `adr`?

`adr` (without the `p`) computes a PC-relative address directly but only reaches ±1MB from the current instruction — fine for nearby local labels, but not reliable for arbitrary global symbols that the linker may place far away. `adrp`+offset reaches the full 4GB range around the current page.

## See Also

- [mem-rip-relative](mem-rip-relative.md) - The x86-64 equivalent (RIP-relative addressing)
- [syntax-pic-pie-default](syntax-pic-pie-default.md) - The PIC requirement this idiom satisfies
- [mem-arm64-addressing-modes](mem-arm64-addressing-modes.md) - General ARM64 addressing reference
