# interop-struct-layout-agreement

> Keep hand-written asm struct field offsets synchronized with the C compiler's actual layout, and re-verify after any struct change

## Why It Matters

Asm code that indexes into a C struct by numeric offset has no compiler-enforced link to that struct's definition; if a field is added, reordered, or the struct's alignment changes for any reason (a new member, a different compiler, a different target ABI), the asm silently reads or writes the wrong field with no build-time error at all.

## Bad

```c
/* record.h */
struct Record {
    uint32_t id;
    uint64_t timestamp;
    uint16_t flags;
};
```

```asm
# record.s, x86-64 AT&T - hardcoded offsets with no link back to the struct definition
.global get_timestamp
get_timestamp:
    mov 4(%rdi), %rax   # assumes timestamp is at offset 4 -- true today, but fragile
    ret
```

## Good

```c
/* record.h - generate the offsets asm should use, and assert they match at compile time */
#include <stddef.h>
struct Record {
    uint32_t id;
    uint64_t timestamp;
    uint16_t flags;
};

_Static_assert(offsetof(struct Record, timestamp) == 8, "Record layout changed; update record.s");
```

```asm
# record.s, x86-64 AT&T - offset named and kept adjacent to the assertion above via a shared header
.equ RECORD_TIMESTAMP_OFFSET, 8   # MUST match offsetof(struct Record, timestamp) in record.h

.global get_timestamp
get_timestamp:
    mov RECORD_TIMESTAMP_OFFSET(%rdi), %rax
    ret
```

## Generating Offsets Automatically

For larger projects, generate an asm-includable header of offsets directly from the C struct definition (a small script running `gcc -E` on a template, or a build-time tool), so the two representations can never drift independently of each other.

```bash
# Example: a Makefile rule regenerating offsets.inc from the real struct layout before assembling
gcc -S -o - gen_offsets.c | grep '#OFFSET' > offsets.inc
```

## See Also

- [mem-struct-field-padding](mem-struct-field-padding.md) - Why offsets aren't just the sum of field sizes
- [proj-header-shared-constants](proj-header-shared-constants.md) - Sharing constants generally between C and asm
- [anti-hardcoded-stack-offset](anti-hardcoded-stack-offset.md) - The analogous stack-frame version of this problem
