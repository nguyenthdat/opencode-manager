# name-label-snake-case

> Name routine labels descriptively in snake_case, matching the convention of the C code they interoperate with

## Why It Matters

Assembly routines are almost always called from, or call into, C/C++ code that follows snake_case (or a project-specific convention) naming. Matching that convention makes the asm read like a natural extension of the surrounding codebase rather than a foreign artifact, and avoids the need for callers to remember a different naming style just for the asm-implemented functions.

## Bad

```asm
# x86-64 AT&T - inconsistent, unclear naming
.global CalcCRC
CalcCRC:
    ret

.global tmp2
tmp2:
    ret
```

## Good

```asm
# x86-64 AT&T - descriptive snake_case, matching the project's C naming convention
.global compute_crc32
compute_crc32:
    ret

.global reverse_byte_order
reverse_byte_order:
    ret
```

## Matching an Existing Project Convention

If the surrounding C++ codebase uses camelCase or PascalCase instead, match that instead of defaulting to snake_case — the goal is consistency with the codebase this asm integrates into, not a universal rule:

```asm
# x86-64 AT&T - matching a camelCase C++ project's existing convention
.global computeCrc32
computeCrc32:
    ret
```

## Descriptive, Not Abbreviated

Prefer `compute_checksum` over `calc_cs`, and `parse_header_v2` over `phv2` — assembly is already harder to skim than high-level code; don't compound that with cryptic names.

## See Also

- [name-global-symbol-verb-noun](name-global-symbol-verb-noun.md) - A specific naming pattern for entry points
- [name-local-label-dot-L](name-local-label-dot-L.md) - Naming internal-only labels differently
- [interop-name-mangling-c](interop-name-mangling-c.md) - Why matching the C-visible name matters for linkage
