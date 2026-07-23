# type-fixed-width-stdint

> Use `<stdint.h>` fixed-width types (`int32_t`, `uint64_t`, ...) whenever a value's exact size matters, instead of `int`/`long`/`short`

## Why It Matters

The C standard only guarantees minimum sizes for `int`/`long`/`short` — their actual widths vary across platforms and ABIs (e.g., `long` is 32 bits on Windows LLP64 but 64 bits on Linux LP64). Code that assumes a specific width for these types breaks silently when ported. `<stdint.h>` types state the exact width you need directly in the type name, making the intent portable and explicit.

## Bad

```c
long file_offset;             /* 32 bits on some ABIs, 64 on others: silently wrong on the "wrong" platform */
unsigned short packet_len;     /* is this 16 bits everywhere? not guaranteed by the standard */
int checksum;                    /* exact width matters for a wire-format field, but int's width isn't fixed */
```

## Good

```c
#include <stdint.h>

int64_t  file_offset;         /* exactly 64 bits, everywhere */
uint16_t packet_len;            /* exactly 16 bits, matches the wire format */
uint32_t checksum;
```

## The Full stdint.h Toolkit

```c
int8_t, int16_t, int32_t, int64_t;         /* exact-width signed */
uint8_t, uint16_t, uint32_t, uint64_t;      /* exact-width unsigned */
int_fast32_t, uint_fast16_t;                   /* fastest type with at least this many bits */
int_least8_t;                                    /* smallest type with at least this many bits */
intptr_t, uintptr_t;                               /* wide enough to hold a converted pointer */
```

## Printing stdint.h Types Portably

```c
#include <inttypes.h>
uint64_t id = get_id();
printf("id: %" PRIu64 "\n", id);   /* correct on every platform, unlike guessing %llu vs %lu */
```

## See Also

- [ub-format-string-mismatch](ub-format-string-mismatch.md) - Format specifiers for these exact types
- [type-avoid-implicit-narrowing](type-avoid-implicit-narrowing.md) - Related type-width safety concern
- [type-static-assert-invariants](type-static-assert-invariants.md) - Asserting a type's exact size when it matters
