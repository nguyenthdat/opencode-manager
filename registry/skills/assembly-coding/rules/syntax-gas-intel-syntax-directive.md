# syntax-gas-intel-syntax-directive

> If a project prefers Intel syntax under GAS, opt in explicitly with `.intel_syntax noprefix` at the top of every such file, consistently

## Why It Matters

GAS can assemble Intel-syntax source via the `.intel_syntax noprefix` directive, which some teams prefer for readability or familiarity with Windows/MASM-style code. But this is a per-file, order-dependent directive — every instruction after it is parsed as Intel syntax until a matching `.att_syntax` (if any), so an incomplete or missing directive at the top of a file silently reverts to AT&T parsing partway through.

## Bad

```asm
# x86-64 - directive placed after real code already assumes Intel syntax was active
.global compute
compute:
    mov rax, rdi     # BUG: parsed as AT&T here (directive hasn't taken effect yet) -> error or misparse
.intel_syntax noprefix
    add rax, rsi
    ret
```

## Good

```asm
# x86-64 - directive placed first, applies to the whole file
.intel_syntax noprefix
global compute
compute:
    mov rax, rdi
    add rax, rsi
    ret
```

## noprefix vs the Default

`.intel_syntax` alone still requires the AT&T-style `%register` prefix; `.intel_syntax noprefix` drops it entirely, matching NASM/MASM conventions most people mean when they say "Intel syntax":

```asm
.intel_syntax          # registers still need %, unusual half-measure
    mov %rax, %rdi

.intel_syntax noprefix  # true Intel syntax, no % needed
    mov rax, rdi
```

## Prefer NASM Directly for New Intel-Syntax Projects

If a project's primary reason for Intel syntax is developer familiarity rather than GAS-specific features, consider using NASM directly instead of `.intel_syntax noprefix` under GAS — NASM's tooling and documentation are built around Intel syntax as the primary target, whereas GAS's Intel mode is a secondary, less-travelled path with occasional directive gaps.

## See Also

- [syntax-consistent-syntax-per-file](syntax-consistent-syntax-per-file.md) - Why this must be applied uniformly per file
- [syntax-nasm-vs-gas-directives](syntax-nasm-vs-gas-directives.md) - Directive differences if you choose NASM instead
- [proj-build-both-syntaxes](proj-build-both-syntaxes.md) - When keeping both variants is actually justified
