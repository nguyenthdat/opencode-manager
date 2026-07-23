# lint-assembler-warnings-as-errors

> Build with the assembler's warning flags enabled and treated as errors (`as --fatal-warnings`), the same discipline applied to compiler warnings

## Why It Matters

GAS emits warnings for a range of genuinely suspicious constructs (e.g. certain operand-size ambiguities it resolved by guessing, deprecated directive usage), and like compiler warnings, these are frequently early signals of an actual bug rather than noise. Leaving warnings enabled but non-fatal means they accumulate unnoticed in CI output that nobody reads, providing none of their intended value.

## Bad

```bash
# Warnings are printed but never block the build; they silently accumulate and get ignored
as checksum.s -o checksum.o
# warning: ... (never seen by anyone, build succeeds regardless)
```

## Good

```bash
# --fatal-warnings turns every assembler warning into a hard build failure
as --fatal-warnings checksum.s -o checksum.o
```

```makefile
# Makefile - wired into the standard build so warnings can never silently slip through
ASFLAGS := -g --fatal-warnings

%.o: %.s
	$(AS) $(ASFLAGS) $< -o $@
```

## Applying This via GCC's Assembler Invocation Too

When assembling through the C compiler driver (common for `.S` files needing preprocessing), pass the flag through to the underlying assembler:

```makefile
CFLAGS += -Wa,--fatal-warnings
```

## Handling a Legitimate, Unavoidable Warning

If a specific warning is a known false positive for a deliberate, documented reason, suppress that specific instance narrowly (rather than disabling `--fatal-warnings` project-wide) and leave a comment explaining why:

```asm
# x86-64 AT&T - deliberately using a construct the assembler warns about, for a documented reason
# NOTE: the following triggers an assembler warning about X; this is intentional because Y.
# See issue #123 for context.
```

## See Also

- [lint-nasm-w-all](lint-nasm-w-all.md) - The NASM equivalent of this discipline
- [lint-ci-multi-assembler](lint-ci-multi-assembler.md) - Running this check across every assembler the project supports
- [doc-todo-fixme-tracked](doc-todo-fixme-tracked.md) - Tracking any deliberately-suppressed warning
