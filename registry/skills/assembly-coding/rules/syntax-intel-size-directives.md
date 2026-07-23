# syntax-intel-size-directives

> In Intel syntax, annotate memory operand size explicitly (`byte ptr`, `word ptr`, `dword ptr`, `qword ptr`) whenever it can't be inferred from a register operand

## Why It Matters

Intel syntax doesn't encode operand size in the mnemonic the way AT&T does (`movb`/`movw`/`movl`/`movq`); instead it relies on a register operand to imply the size, or an explicit size-ptr keyword when there's no register to infer from — such as `mov [rdi], 5`, where the assembler has no way to know if you mean a byte, word, dword, or qword write of the constant 5.

## Bad

```asm
; x86-64 Intel (NASM) - ambiguous: what size write is this?
mov [rdi], 5      ; NASM will actually reject this as ambiguous without a size
```

## Good

```asm
; x86-64 Intel (NASM) - size made explicit
mov qword [rdi], 5      ; store the 8-byte immediate 5
mov byte  [rdi], 5        ; store just the 1-byte immediate 5
```

## When the Register Operand Already Implies Size

```asm
; x86-64 Intel (NASM) - no ptr keyword needed, eax's width settles it
mov eax, [rdi]      ; unambiguous: eax is 32 bits, so this is a 32-bit load
mov rax, [rdi]       ; unambiguous: rax is 64 bits, so this is a 64-bit load
```

## AT&T's Equivalent: Mnemonic Suffixes

```asm
# x86-64 AT&T - the mnemonic suffix (b/w/l/q) does the same job Intel's ptr keyword does
movb $5, (%rdi)     # store a 1-byte immediate
movq $5, (%rdi)      # store an 8-byte immediate
```

## Size Keyword Reference (Intel/NASM)

| Keyword | Size |
|---|---|
| `byte ptr` | 1 byte |
| `word ptr` | 2 bytes |
| `dword ptr` | 4 bytes |
| `qword ptr` | 8 bytes |
| `xmmword ptr` | 16 bytes (SSE) |
| `ymmword ptr` | 32 bytes (AVX) |

(NASM omits the `ptr` keyword itself — `dword [rdi]` — while MASM and Intel's own documentation use `dword ptr [rdi]`; know which flavor your assembler expects.)

## See Also

- [syntax-att-suffix-size](syntax-att-suffix-size.md) - AT&T's suffix-based equivalent
- [syntax-att-immediate-percent](syntax-att-immediate-percent.md) - Other AT&T-vs-Intel syntax differences
- [syntax-nasm-vs-gas-directives](syntax-nasm-vs-gas-directives.md) - Broader NASM/GAS directive differences
