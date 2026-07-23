# doc-clobber-comment

> Comment which registers a routine modifies beyond the ABI's caller-saved set, so callers (and future maintainers) know what survives a call

## Why It Matters

The calling convention already tells a caller which registers are caller-saved (may be freely clobbered) and callee-saved (must be preserved) — but a routine that clobbers *fewer* caller-saved registers than the ABI technically permits is valuable information for a caller trying to keep a value alive across the call in a register instead of spilling it, and a routine that (incorrectly) clobbers a callee-saved register needs that documented as a bug, not silently discovered later.

## Bad

```asm
# x86-64 AT&T - no indication of what this routine actually touches
.global normalize_vector
normalize_vector:
    # implementation clobbers xmm0-xmm3, rax, rcx internally -- none of this is documented
    ret
```

## Good

```asm
# x86-64 AT&T (SysV)
# void normalize_vector(float *v)
#   v: rdi
#   clobbers: rax, rcx, xmm0, xmm1, xmm2, xmm3 (all caller-saved per SysV, so no violation,
#             but documented so callers keeping other values in xmm4+ know they're safe)
.global normalize_vector
normalize_vector:
    # ...
    ret
```

## Documenting an Unusually Narrow Clobber Set

If a routine has been specifically optimized to touch only one or two registers (useful information for a caller in a tight register-allocation situation), call that out explicitly:

```asm
# x86-64 AT&T (SysV)
# int64_t fast_popcount(uint64_t x)
#   x: rdi -> result: rax
#   clobbers: rax ONLY (deliberately minimized; safe to call without spilling anything but rax)
.global fast_popcount
fast_popcount:
    popcnt %rdi, %rax
    ret
```

## See Also

- [doc-entry-register-contract](doc-entry-register-contract.md) - The broader entry-point documentation this is part of
- [abi-callee-saved-regs](abi-callee-saved-regs.md) - The ABI rule this comment must never contradict
- [anti-clobber-callee-saved](anti-clobber-callee-saved.md) - The bug this documentation practice helps catch in review
