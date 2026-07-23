# proj-header-shared-constants

> Generate or share a single canonical source of truth for constants and struct offsets used by both C and asm, instead of maintaining two hand-synced copies

## Why It Matters

A constant or struct-offset value defined independently in a C header and again in an asm `.equ`/`%define` block will inevitably drift the moment either side changes without the other being updated in the same commit — and because the two definitions live in different languages, no compiler error catches the mismatch; it manifests only as a runtime bug.

## Bad (Two Independently-Maintained Copies)

```c
/* record.h */
#define MAX_RECORD_SIZE 256
```

```asm
# record.s, x86-64 AT&T - a second, independently maintained copy of the same constant
.equ MAX_RECORD_SIZE, 512   # BUG: drifted from record.h's value of 256, nothing catches this
```

## Good (Single Source, Included by Both)

```c
/* shared_constants.h - the one canonical definition, included by both C and asm builds */
#define MAX_RECORD_SIZE 256
```

```asm
# record.S, x86-64 AT&T (note capital .S so gcc's driver runs the C preprocessor first)
#include "shared_constants.h"

.equ MAX_RECORD_SIZE_ASM, MAX_RECORD_SIZE   ; .equ can reference a cpp-expanded macro value
```

```c
/* main.c */
#include "shared_constants.h"
uint8_t buffer[MAX_RECORD_SIZE];
```

## Generating Struct Offsets Automatically

For struct field offsets specifically, generate an asm-includable file directly from the real struct definition at build time, rather than hand-transcribing `offsetof` results:

```c
/* gen_offsets.c - a tiny build-time tool emitting .equ-compatible offset constants */
#include <stddef.h>
#include <stdio.h>
#include "record.h"

int main(void) {
    printf(".equ RECORD_TIMESTAMP_OFFSET, %zu\n", offsetof(struct Record, timestamp));
    return 0;
}
```

```makefile
# Makefile rule - regenerate offsets.inc automatically whenever record.h changes
offsets.inc: gen_offsets record.h
	./gen_offsets > offsets.inc
```

## See Also

- [interop-struct-layout-agreement](interop-struct-layout-agreement.md) - The specific struct-offset version of this problem
- [syntax-equ-named-constants](syntax-equ-named-constants.md) - Named constants in asm generally
- [name-constant-screaming-snake](name-constant-screaming-snake.md) - Consistent naming across the shared definitions
