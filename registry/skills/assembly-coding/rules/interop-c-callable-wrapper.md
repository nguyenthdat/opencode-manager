# interop-c-callable-wrapper

> Expose hand-written asm routines through a clean C-callable function signature, not raw labels callers must know ABI trivia to use

## Why It Matters

A raw asm label with no accompanying prototype forces every caller to independently know (and keep in sync) the argument registers, return convention, and any non-obvious preconditions (alignment, ownership of buffers, etc.). A proper C header declaring the function's signature turns those details into a compiler-checked contract instead of tribal knowledge.

## Bad

```asm
# x86-64 AT&T - no accompanying header; callers must know the ABI details by folklore
.global fast_checksum
fast_checksum:
    # takes ptr in rdi, len in rsi; returns checksum in rax -- documented nowhere
    xor %eax, %eax
    # ...
    ret
```

## Good

```c
/* checksum.h - the C-callable contract for the asm routine below */
#include <stdint.h>
#include <stddef.h>

/* Computes a 32-bit checksum over `len` bytes starting at `data`.
 * `data` must be non-NULL if `len` > 0. Safe to call with len == 0. */
uint32_t fast_checksum(const uint8_t *data, size_t len);
```

```asm
# checksum.s, x86-64 AT&T - implementation matching the header's declared signature exactly
.global fast_checksum
# uint32_t fast_checksum(const uint8_t *data /* rdi */, size_t len /* rsi */)
fast_checksum:
    xor %eax, %eax
    test %rsi, %rsi
    jz   .done
.loop:
    movzbl (%rdi), %ecx
    add    %ecx, %eax
    inc    %rdi
    dec    %rsi
    jnz    .loop
.done:
    ret
```

```c
/* main.c - calls the asm routine exactly like any other C function */
#include "checksum.h"
uint32_t total = fast_checksum(buffer, sizeof(buffer));
```

## What the Wrapper/Header Should Document

- Exact parameter types and count matching the ABI's register assignment
- Ownership/lifetime expectations for any pointer arguments
- Preconditions (alignment, non-null, bounds) the asm does not itself check
- Thread-safety and reentrancy characteristics

## See Also

- [doc-entry-register-contract](doc-entry-register-contract.md) - Documenting the same contract inside the asm file itself
- [interop-name-mangling-c](interop-name-mangling-c.md) - Making the symbol name match what C expects
- [test-c-harness-wrapper](test-c-harness-wrapper.md) - Testing the routine through this same C boundary
