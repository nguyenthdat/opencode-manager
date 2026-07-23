# anti-mixed-syntax

> Don't mix AT&T and Intel syntax carelessly within the same file or copy-pasted snippet

## Why It Matters

The two syntaxes share mnemonics but disagree on operand order and sigil usage; a file that accidentally blends them (a pasted Intel-syntax line dropped into an AT&T file, or vice versa) either fails to assemble, or — more dangerously — assembles into something with swapped source/destination operands that silently computes the wrong result.

## Bad

```asm
# x86-64 - an AT&T file with an accidentally pasted Intel-syntax line mixed in
.global compute
compute:
    mov  %rdi, %rax
    add  rax, rsi        # BUG: Intel-syntax operand order/no sigils pasted into an AT&T file
    ret
```

## Good

```asm
# x86-64 AT&T - consistent syntax throughout
.global compute
compute:
    mov  %rdi, %rax
    add  %rsi, %rax
    ret
```

## Why This Is Especially Dangerous, Not Just Untidy

Unlike most syntax errors, an accidental mix doesn't always fail to assemble — both syntaxes share the same mnemonic vocabulary, so a line like `add rax, rsi` can, depending on the assembler's mode and the specific operands, either be rejected outright or silently misparsed in a way that still produces valid (but wrong) machine code. A reviewer skimming the diff, expecting AT&T conventions throughout, is unlikely to notice the swapped operand order at a glance.

## A Second Common Way This Happens: Copying From Documentation

Instruction reference manuals (Intel's own SDM, most online instruction references) are written in Intel syntax by convention; copying an example operand sequence directly from such a reference into an AT&T-syntax file without manually reversing the operand order is one of the most common sources of this exact bug.

```asm
# x86-64 AT&T - operand order copied verbatim from an Intel-syntax reference manual example,
# without reversing it for AT&T's src,dst convention
mov %rax, %rdi    # if the manual's example was "mov rdi, rax" (Intel), this is now BACKWARDS
```

## The Fix: Always Translate, Never Copy Verbatim

When porting an example from Intel-syntax documentation into an AT&T-syntax file, explicitly reverse the operand order and add the required sigils as a deliberate translation step, then verify against the disassembly (see `test-disassemble-verify`) rather than trusting the transcription by eye.

## See Also

- [syntax-consistent-syntax-per-file](syntax-consistent-syntax-per-file.md) - The full rule this anti-pattern violates
- [syntax-att-operand-order](syntax-att-operand-order.md) - The specific operand-order confusion at the root of this bug
- [syntax-gas-intel-syntax-directive](syntax-gas-intel-syntax-directive.md) - The deliberate, documented way to use Intel syntax under GAS if needed
- [test-disassemble-verify](test-disassemble-verify.md) - Verifying the actual encoded instruction, not just the source text
