# lint-nasm-w-all

> Enable NASM's `-Wall` warning set (and consider `-Werror` to make them fatal) rather than assembling with default, minimal warnings

## Why It Matters

NASM's default warning configuration is deliberately conservative, so a range of genuinely useful warnings (uninitialized-looking data declarations, size-mismatch on operands, unused macro parameters, and others) are silent unless explicitly requested. `-Wall` surfaces these, and pairing it with `-Werror` gives NASM the same "warnings are build failures" discipline recommended for GAS.

## Bad

```bash
# Default NASM invocation - misses several categories of genuinely useful warnings
nasm -f elf64 checksum.asm -o checksum.o
```

## Good

```bash
# -Wall enables NASM's full warning set; -Werror makes them build-breaking
nasm -f elf64 -Wall -Werror checksum.asm -o checksum.o
```

```makefile
# Makefile - wired into the standard NASM build
NASMFLAGS := -f elf64 -Wall -Werror -g

%.o: %.asm
	nasm $(NASMFLAGS) $< -o $@
```

## Common Warnings -Wall Surfaces

- `-w+orphan-labels` - a label with no following instruction on the same or next line, often a typo
- `-w+number-overflow` - a numeric literal that doesn't fit the specified operand size
- `-w+macro-params` - a macro invoked with a different argument count than defined
- `-w+label-redef` - a label redefined without an intervening `%unmacro`/scope boundary

## Selectively Disabling One Specific Warning

If one specific warning is a persistent false positive for a legitimate NASM idiom the project relies on, disable only that one rather than dropping `-Wall` entirely:

```bash
nasm -f elf64 -Wall -Werror -Wno-orphan-labels checksum.asm -o checksum.o
```

## See Also

- [lint-assembler-warnings-as-errors](lint-assembler-warnings-as-errors.md) - The GAS equivalent of this discipline
- [lint-ci-multi-assembler](lint-ci-multi-assembler.md) - Running both assemblers' warning sets in CI
- [syntax-nasm-vs-gas-directives](syntax-nasm-vs-gas-directives.md) - Directive differences worth knowing when reading NASM warnings
