# name-avoid-reserved-mnemonics

> Never name a label, symbol, or macro identically to an instruction mnemonic, register name, or assembler directive

## Why It Matters

Assemblers generally allow labels that happen to share text with a mnemonic or register name in some contexts, but the result is often ambiguous to a human reader, occasionally ambiguous to the assembler itself (especially with macros or specific directive combinations), and always a maintenance hazard the moment someone greps for the mnemonic and gets confused by an unrelated label of the same name.

## Bad

```asm
# x86-64 AT&T - a label named exactly like a common mnemonic ("call") or register-ish word
.global process
call:                  # BUG-prone: named identically to the `call` instruction
    ret

process:
    jmp call            # is this branching to a label, or is something bizarre going on?
```

## Good

```asm
# x86-64 AT&T - clearly distinct, descriptive names that can't be confused with mnemonics
.global process
invoke_callback:
    ret

process:
    jmp invoke_callback
```

## Also Avoid Shadowing Register Names in Macros

```asm
# x86-64 AT&T - macro parameter named "rax" is confusing even though it's technically legal
.macro add_to rax, val
    add \val, \rax        # which "rax" is this -- the parameter, or the real register?
.endm
```

```asm
# x86-64 AT&T - clearly distinct macro parameter name
.macro add_to dst, val
    add \val, \dst
.endm
```

## Quick Self-Check

Before finalizing a label or symbol name, check it against the target's instruction mnemonic list and register name list (both easily found in the assembler's documentation) — if it matches either, or is a near-miss that could be misread as one, rename it.

## See Also

- [name-label-snake-case](name-label-snake-case.md) - General label naming guidance
- [name-register-alias-descriptive](name-register-alias-descriptive.md) - Naming register aliases without this collision risk
- [lint-consistent-indentation-style](lint-consistent-indentation-style.md) - Broader readability/style discipline
