# syntax-consistent-syntax-per-file

> Never mix AT&T and Intel syntax within a single source file or a single build's toolchain invocation

## Why It Matters

A file assembled with GAS defaults to AT&T syntax throughout; switching mid-file (even with `.intel_syntax noprefix`) without clearly separating the regions, or copy-pasting Intel-syntax snippets into an AT&T file expecting the assembler to "figure it out," produces operand-order and sigil errors that are hard to spot by eye since both syntaxes use the same mnemonics.

## Bad

```asm
# x86-64 - AT&T-syntax file with an accidentally pasted Intel-syntax line
.global compute
compute:
    mov  %rdi, %rax
    add  rax, rsi        # BUG: Intel-syntax operand order/no sigils, pasted into an AT&T file
    ret
```

## Good

```asm
# x86-64 AT&T - consistent throughout
.global compute
compute:
    mov  %rdi, %rax
    add  %rsi, %rax
    ret
```

## If You Must Mix (Rare, Document Clearly)

GAS does support switching modes mid-file, but treat it as an exception that needs a comment, not a routine practice:

```asm
# x86-64 - deliberately switching to Intel syntax for a pasted-in reference snippet, clearly marked
.intel_syntax noprefix
# --- BEGIN Intel-syntax block (ported from vendor sample, kept as-is for diffability) ---
compute_intel:
    mov rax, rdi
    add rax, rsi
    ret
# --- END Intel-syntax block ---
.att_syntax prefix
```

## Project-Level Consistency

Pick one syntax for the whole project (or at minimum, one syntax per file, never mixed within a file) and state the choice at the top of each file or in the project's build documentation, so contributors don't have to guess which rules apply.

## See Also

- [syntax-att-operand-order](syntax-att-operand-order.md) - The core operand-order difference to keep straight
- [syntax-gas-intel-syntax-directive](syntax-gas-intel-syntax-directive.md) - Using `.intel_syntax noprefix` deliberately
- [anti-mixed-syntax](anti-mixed-syntax.md) - The anti-pattern this rule is named to prevent
