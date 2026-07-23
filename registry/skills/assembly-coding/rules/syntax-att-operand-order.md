# syntax-att-operand-order

> AT&T syntax orders operands source-then-destination; Intel syntax orders them destination-then-source

## Why It Matters

This is the single biggest gotcha when moving between the two dominant x86 syntaxes: the exact same instruction, with the exact same two operands in the exact same registers, means the opposite thing depending on which syntax you're reading. Misreading one for the other silently swaps source and destination, producing code that assembles fine and computes the wrong answer.

## Bad (Mixing Up the Order)

```asm
# x86-64 AT&T - written as if it were Intel order: this actually moves rax INTO rdi's slot, backwards from what was intended
.global set_result_wrong
set_result_wrong:
    mov %rdi, %rax    # AT&T: src=rdi, dst=rax -- if you meant "put rax into rdi", this is backwards
    ret
```

## Good

```asm
# x86-64 AT&T - correct AT&T order: src, dst
.global set_result
set_result:
    mov %rax, %rdi    # rdi = rax  (src=rax, dst=rdi)
    mov %rdi, %rax    # rax = rdi  (src=rdi, dst=rax) -- pick the one you actually mean
    ret
```

## Side-by-Side Comparison

```asm
# AT&T syntax (GAS): source, destination
mov  %rsi, %rdi        # rdi = rsi
add  %rax, %rbx        # rbx = rbx + rax
sub  $8, %rsp           # rsp = rsp - 8
```

```asm
; Intel syntax (NASM/MASM): destination, source
mov  rdi, rsi           ; rdi = rsi   (same operation as above, opposite written order)
add  rbx, rax           ; rbx = rbx + rax
sub  rsp, 8              ; rsp = rsp - 8
```

## Memory Mnemonic

AT&T: "source goes in first, like an English sentence walking left to right toward its destination" -- or simply memorize: **AT&T = src, dst**; **Intel = dst, src**. When in doubt, check which operand is the one being modified.

## See Also

- [syntax-att-immediate-percent](syntax-att-immediate-percent.md) - Another AT&T-specific syntax marker
- [syntax-consistent-syntax-per-file](syntax-consistent-syntax-per-file.md) - Never mix the two within one file
- [anti-mixed-syntax](anti-mixed-syntax.md) - The anti-pattern of careless syntax mixing
