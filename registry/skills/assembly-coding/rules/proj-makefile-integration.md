# proj-makefile-integration

> Wire `.s`/`.asm` assembly sources into the project's Makefile alongside C/C++ sources, with the correct assembler flags and dependency tracking

## Why It Matters

Assembly files need a different toolchain invocation than C/C++ sources (the assembler itself, not the compiler, for `.s` files that are pre-processed already; or the compiler's assembler front-end for `.S` files needing C-preprocessor handling first), and forgetting to integrate them properly into the build either leaves them unbuilt, rebuilds them unnecessarily on every invocation, or silently uses the wrong flags.

## Bad (No Real Integration)

```makefile
# Makefile - asm sources not integrated into the normal dependency-tracked build at all
all:
	gcc -c main.c -o main.o
	as checksum.s -o checksum.o    # manually invoked, no dependency tracking, easy to forget
	gcc main.o checksum.o -o app
```

## Good

```makefile
# Makefile - .s files integrated into the standard pattern-rule-based build
CC      := gcc
AS      := as
CFLAGS  := -Wall -Wextra -g -O2
ASFLAGS := -g --fatal-warnings

SRCS_C  := main.c parser.c
SRCS_S  := checksum_x86_64.s
OBJS    := $(SRCS_C:.c=.o) $(SRCS_S:.s=.o)

app: $(OBJS)
	$(CC) $(OBJS) -o $@

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

%.o: %.s
	$(AS) $(ASFLAGS) $< -o $@

clean:
	rm -f $(OBJS) app

.PHONY: clean
```

## Handling `.S` Files That Need C Preprocessing

A capital-`.S` extension tells GCC's driver to run the C preprocessor over the file before assembling — useful for `#include`d shared constants or `#ifdef`-based per-architecture variants (see `proj-header-shared-constants`):

```makefile
%.o: %.S
	$(CC) $(CFLAGS) -c $< -o $@   # note: CC, not AS -- lets gcc's driver invoke cpp first
```

## Per-Architecture Source Selection in the Makefile

```makefile
# Select the correct arch-specific asm source based on the build target
ARCH ?= $(shell uname -m)
SRCS_S := checksum_$(ARCH).s
```

## See Also

- [proj-cmake-asm-language](proj-cmake-asm-language.md) - The CMake equivalent of this integration
- [name-file-per-arch-suffix](name-file-per-arch-suffix.md) - Naming convention this Makefile pattern relies on
- [lint-assembler-warnings-as-errors](lint-assembler-warnings-as-errors.md) - The --fatal-warnings flag shown above
