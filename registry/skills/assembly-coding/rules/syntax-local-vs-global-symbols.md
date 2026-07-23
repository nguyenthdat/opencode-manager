# syntax-local-vs-global-symbols

> Prefix internal jump-target labels with `.L` (GAS convention) so they stay out of the symbol table and never collide across files

## Why It Matters

GAS treats labels beginning with `.L` as assembler-local: they never appear in the object file's symbol table at all, which keeps `nm`/backtraces/linker symbol listings free of clutter, and — critically — guarantees they can never collide with a same-named local label in another translation unit, since they aren't in any shared namespace to begin with.

## Bad

```asm
# x86-64 AT&T - ordinary labels for internal-only jump targets leak into the symbol table
.global compute
compute:
    test %rdi, %rdi
    jz   done            # "done" pollutes the symbol table and could collide with another file's "done"
    mov  %rdi, %rax
done:
    ret
```

## Good

```asm
# x86-64 AT&T - .L-prefixed labels are assembler-local, never emitted to the symtab
.global compute
compute:
    test %rdi, %rdi
    jz   .Ldone
    mov  %rdi, %rax
.Ldone:
    ret
```

## Verifying With nm

```bash
as compute.s -o compute.o
nm compute.o
# 0000000000000000 T compute      <- only the intentionally-global symbol shows up
# (.Ldone does not appear at all)
```

## NASM's Equivalent: the Leading Dot for Local Labels

```asm
; x86-64 Intel (NASM) - local labels scoped to the preceding global label
global compute
compute:
    test rdi, rdi
    jz   .done            ; NASM's ".name" labels are scoped locally to "compute"
    mov  rax, rdi
.done:
    ret
```

## See Also

- [syntax-global-visibility](syntax-global-visibility.md) - The complementary .global/.globl directive
- [name-local-label-dot-L](name-local-label-dot-L.md) - Naming-convention guidance for these labels
- [lint-no-dead-code-sections](lint-no-dead-code-sections.md) - Keeping the symbol table clean generally
