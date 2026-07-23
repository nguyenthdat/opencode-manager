# lint-checksec-binary

> Run a `checksec`-style tool against the final linked binary to verify NX, PIE, RELRO, and stack-canary protections are actually present, not just assumed

## Why It Matters

Hand-written asm can inadvertently defeat security mitigations the rest of the toolchain would otherwise provide by default — an executable stack accidentally requested, a missing `-pie`/`-fPIC` flag breaking position-independence, or a build configuration that drops stack-protector support for the C files calling into the asm. Checking the actual, final binary's properties (rather than trusting the build configuration alone) catches cases where an assumption about a flag's effect turned out to be wrong.

## Bad (Never Checked)

```bash
# Ship the binary without ever verifying its actual security-relevant properties
gcc -fPIC -pie main.c checksum.o -o app
# ... assumed to be PIE, NX-safe, etc. -- never actually verified
```

## Good

```bash
# checksec reports the binary's actual security-relevant properties
checksec --file=./app
```

```
RELRO           STACK CANARY      NX            PIE             RPATH      RUNPATH
Full RELRO      Canary found      NX enabled    PIE enabled     No RPATH   No RUNPATH
```

## Manually Checking Individual Properties Without checksec

```bash
# NX (non-executable stack): the GNU_STACK segment should NOT have the 'E' (execute) flag
readelf -l app | grep -A1 GNU_STACK

# PIE: the ELF type should be DYN (position-independent executable), not EXEC
readelf -h app | grep Type

# RELRO: GNU_RELRO segment should be present, and the GOT should be marked read-only after startup
readelf -l app | grep GNU_RELRO
```

## What to Do When a Property Is Unexpectedly Missing

If `checksec` reports NX disabled or PIE missing on a binary that was supposed to have both, the most common causes are: a hand-written asm file requesting an executable stack via its `.note.GNU-stack` section (or lacking one at all, which some linkers interpret conservatively), or a missing `-pie`/`-fPIC` flag somewhere in the link step — both worth checking first.

```asm
# x86-64 AT&T - explicitly marking the stack non-executable at the assembly level (GNU-specific)
.section .note.GNU-stack,"",@progbits
```

## See Also

- [safe-nx-stack-no-exec](safe-nx-stack-no-exec.md) - The NX property this check verifies
- [syntax-pic-pie-default](syntax-pic-pie-default.md) - The PIE property this check verifies
- [safe-stack-canary-respect](safe-stack-canary-respect.md) - The stack-canary property this check verifies
