# syntax-att-suffix-size

> AT&T mnemonic suffixes (`b`, `w`, `l`, `q`) declare the operand size when it isn't otherwise obvious from a register operand

## Why It Matters

Because AT&T immediates and memory operands carry no inherent size marker (`$5` could mean a byte, word, dword, or qword constant), the assembler needs the mnemonic suffix to know how many bytes to move, and getting the suffix wrong either produces an assembler error (operand size mismatch with a register) or silently writes the wrong number of bytes to memory.

## Bad

```asm
# x86-64 AT&T - ambiguous suffix-less mnemonic with only a memory operand: GAS will reject this
mov $5, (%rdi)     # error: GAS requires a suffix here, no register to infer size from
```

## Good

```asm
# x86-64 AT&T - explicit suffixes remove the ambiguity
movb $5, (%rdi)      # store a 1-byte immediate
movw $5, (%rdi)       # store a 2-byte immediate
movl $5, (%rdi)        # store a 4-byte immediate
movq $5, (%rdi)         # store an 8-byte immediate
```

## Suffix Reference

| Suffix | Size | Meaning |
|---|---|---|
| `b` | 1 byte | byte |
| `w` | 2 bytes | word |
| `l` | 4 bytes | long (32-bit) |
| `q` | 8 bytes | quad (64-bit) |

## Suffix Is Redundant (but Harmless) With a Register Operand

```asm
# x86-64 AT&T - register operand already implies size; suffix is optional here
mov  %eax, (%rdi)    # unambiguous: eax is 32 bits
movl %eax, (%rdi)     # equivalent, suffix is explicit but not required
```

Many style guides prefer keeping the suffix even when redundant, for consistency and to make the size visually obvious without checking which register is involved — pick one convention per project and apply it consistently.

## See Also

- [syntax-intel-size-directives](syntax-intel-size-directives.md) - Intel syntax's equivalent (dword ptr, etc.)
- [syntax-att-immediate-percent](syntax-att-immediate-percent.md) - The $/% sigil rules this pairs with
- [lint-consistent-indentation-style](lint-consistent-indentation-style.md) - General style consistency guidance
