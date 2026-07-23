# lint-consistent-indentation-style

> Keep a consistent column alignment for mnemonics, operands, and comments throughout a file so the code reads as a scannable table, not a ragged list

## Why It Matters

Assembly is unusually dense and repetitive at the token level (mnemonic, operand, operand, optional comment), which makes it especially sensitive to visual alignment — a consistently-columned file lets a reader's eye track down a single column (all the destination registers, say) across many lines, while a raggedly-indented file forces re-parsing each line from scratch.

## Bad

```asm
# x86-64 AT&T - inconsistent indentation and spacing make this hard to scan
.global process
process:
   mov %rdi,%rax
        add %rsi, %rax
mov    %rax,%rdx
      sub $1,   %rdx
    ret
```

## Good

```asm
# x86-64 AT&T - consistent column alignment: mnemonic, then operands, then comment
.global process
process:
    mov  %rdi, %rax
    add  %rsi, %rax
    mov  %rax, %rdx
    sub  $1,   %rdx      # decrement before use
    ret
```

## A Simple Convention That Scales

- One consistent indentation width for instructions under a label (commonly 4 spaces, or one tab)
- A fixed minimum column width for the mnemonic before operands begin
- Comments aligned to a consistent column when they appear on the same line as an instruction, when practical

## Automating This With a Formatter

Some projects use a lightweight formatting script (or an editor's alignment feature) to enforce this automatically, similar to how `clang-format`/`rustfmt` remove style debates from C/Rust code review — while no single dominant asm formatter exists, even a small in-house script applied via a pre-commit hook removes this from human review entirely.

## See Also

- [name-label-snake-case](name-label-snake-case.md) - Naming consistency, a related readability concern
- [doc-section-purpose-comment](doc-section-purpose-comment.md) - Comment placement conventions this pairs with
- [lint-no-dead-code-sections](lint-no-dead-code-sections.md) - Keeping the file free of clutter generally
