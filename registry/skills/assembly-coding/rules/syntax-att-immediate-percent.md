# syntax-att-immediate-percent

> AT&T syntax requires `$` before immediates and `%` before register names; Intel syntax uses neither

## Why It Matters

These sigils are how the GAS assembler tells an immediate constant apart from a memory address, and a register name apart from a bare symbol. Omitting `$` in AT&T syntax turns what you meant as a literal constant into a memory-dereference (or an assembler error), and omitting `%` makes a register name look like an undefined symbol.

## Bad

```asm
# x86-64 AT&T - missing $ turns "move the constant 8" into "move the value AT address 8"
.global set_eight_wrong
set_eight_wrong:
    mov  8, %rax    # BUG: this means "load the 8-byte value at absolute address 8", not "load 8"
    ret
```

## Good

```asm
# x86-64 AT&T - $ marks this as an immediate constant
.global set_eight
set_eight:
    mov  $8, %rax    # rax = 8 (the literal constant)
    ret
```

## Sigil Reference (AT&T / GAS)

| Prefix | Meaning | Example |
|---|---|---|
| `%` | register | `%rax`, `%eax`, `%al` |
| `$` | immediate constant | `$8`, `$0xFF`, `$label` (address-of, for absolute) |
| (none) | memory operand or symbol | `8(%rdi)`, `counter` |

## Intel Syntax Has No Equivalent Sigils

```asm
; Intel syntax (NASM) - no % or $ prefixes needed; disambiguation comes from context and size directives
mov rax, 8          ; immediate 8
mov rax, [8]         ; memory at absolute address 8 (rare, needs explicit brackets)
mov rax, rbx          ; register-to-register
```

The presence or absence of brackets (`[...]`) is what marks a memory operand in Intel syntax, versus the presence or absence of `$`/`%` prefixes in AT&T syntax — internalizing which system you're reading is essential before trusting your interpretation of any given line.

## See Also

- [syntax-att-operand-order](syntax-att-operand-order.md) - The other major AT&T/Intel divergence
- [syntax-att-suffix-size](syntax-att-suffix-size.md) - How AT&T encodes operand size instead of Intel's directives
- [syntax-intel-size-directives](syntax-intel-size-directives.md) - Intel's `dword ptr` style size annotation
