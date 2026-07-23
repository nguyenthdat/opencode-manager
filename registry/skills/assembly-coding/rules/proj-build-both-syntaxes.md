# proj-build-both-syntaxes

> Maintain both an AT&T and an Intel-syntax variant of the same routine only when there's a concrete reason (a NASM-only feature, an existing MASM-based Windows build), not out of habit

## Why It Matters

Keeping two syntax variants of the same logic doubles the maintenance burden — every future change to the routine must be applied twice, correctly, in two different syntaxes, and any bug fix risks being applied to only one variant while the other silently continues to ship the old, buggy version. This is only worth the cost when a genuine, specific requirement demands it.

## Bad (Duplication Without a Real Reason)

```asm
# checksum_att.s, x86-64 AT&T - maintained purely because "some people prefer AT&T"
.global compute_checksum
compute_checksum:
    mov %rdi, %rax
    ret
```

```asm
; checksum_intel.asm, x86-64 Intel (NASM) - a second copy of the identical logic, no build actually needs both
global compute_checksum
compute_checksum:
    mov rax, rdi
    ret
```

## Good (One Canonical Variant, Chosen Deliberately)

```asm
# checksum.s, x86-64 AT&T - the project's single chosen syntax, used consistently everywhere
.global compute_checksum
compute_checksum:
    mov %rdi, %rax
    ret
```

## When Maintaining Both Is Actually Justified

```
# A genuine example: a project ships a GAS/AT&T Linux build AND a legacy MASM-based
# Windows build inherited from an existing codebase that cannot be migrated wholesale.
src/
  checksum_gas.s      # GAS/AT&T, Linux/macOS build
  checksum_masm.asm    # MASM/Intel, existing Windows build, migration not yet justified
```

In this case, add a prominent comment in both files cross-referencing the other, and a CI check (or code-review checklist item) requiring any change to one to be verified against the other.

## The Default Should Be One Variant

Absent a specific, documented reason, standardize on one syntax project-wide (see `syntax-consistent-syntax-per-file`) and let anyone needing the other syntax generate it via a translation tool or the assembler's cross-syntax support, rather than hand-maintaining a permanent duplicate.

## See Also

- [syntax-consistent-syntax-per-file](syntax-consistent-syntax-per-file.md) - The default single-syntax discipline this is an exception to
- [syntax-gas-intel-syntax-directive](syntax-gas-intel-syntax-directive.md) - An alternative to full duplication for occasional Intel-syntax needs
- [lint-ci-multi-assembler](lint-ci-multi-assembler.md) - Testing genuinely-duplicated variants in CI
