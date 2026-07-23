# perf-avoid-false-dependency

> Break false register dependencies (e.g. writing only part of a register) so independent instruction chains can execute in parallel

## Why It Matters

Out-of-order CPUs execute independent instructions in parallel, limited by data dependencies between them. A "false" dependency — where an instruction appears to depend on a prior value only because it partially writes the same physical register, not because it actually needs that value — artificially serializes what should be independent work, capping the achievable instruction-level parallelism below what the hardware could otherwise sustain.

## Bad

```asm
# x86-64 AT&T - four independent popcount operations, but each register write looks
# dependent on whatever last wrote that register due to partial-register merges
.global sum_four_popcounts_wrong
sum_four_popcounts_wrong:
    popcnt %rdi, %ax    # BUG-prone: 16-bit destination creates a merge dependency on old %ax/%eax/%rax
    popcnt %rsi, %bx
    popcnt %rdx, %cx
    popcnt %rcx, %dx
    ret
```

## Good

```asm
# x86-64 AT&T - full-width destinations, no partial-register merge dependency
.global sum_four_popcounts
sum_four_popcounts:
    popcnt %rdi, %rax
    popcnt %rsi, %r8
    popcnt %rdx, %r9
    popcnt %rcx, %r10
    add    %r8, %rax
    add    %r9, %rax
    add    %r10, %rax
    ret
```

## Breaking a Dependency With xor-Zero Before a Partial Write

```asm
# x86-64 AT&T - if a partial-width write is unavoidable, zero the register first to
# break any dependency on its previous value
xor  %eax, %eax    # zeroing idiom recognized as dependency-breaking by the CPU
mov  (%rdi), %al     # now this partial write has no false dependency on stale %rax content
```

## This Applies to SIMD Too

Some SIMD instructions (certain single-precision-to-double-precision conversions, or instructions that only touch part of a wide register) can have the same false-dependency issue; check the specific instruction's documented behavior (Intel's optimization manual lists these explicitly) before assuming a "safe" width choice.

## See Also

- [reg-partial-register-stall](reg-partial-register-stall.md) - The related partial-register-stall concern
- [reg-xor-zero-idiom](reg-xor-zero-idiom.md) - The dependency-breaking zero idiom used above
- [perf-instruction-level-parallelism](perf-instruction-level-parallelism.md) - The broader ILP-maximization goal this serves
