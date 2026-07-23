# perf-minimize-memory-traffic

> Keep frequently-used values in registers across a computation rather than repeatedly reloading them from memory

## Why It Matters

Even an L1 cache hit costs several cycles, and a register read costs effectively zero extra latency once the value is already there — a loop that reloads the same memory location on every iteration when it could instead keep that value live in a register pays a real, avoidable cost multiplied by the iteration count.

## Bad

```asm
# x86-64 AT&T - reloads the base pointer and length from memory every iteration
.global sum_config_wrong
sum_config_wrong:
    # struct Config { int64_t *data; int64_t len; } *cfg (rdi)
    xor  %rax, %rax
    xor  %rcx, %rcx
.loop:
    mov  8(%rdi), %rdx      # reloads cfg->len every iteration -- it never changes!
    cmp  %rdx, %rcx
    jge  .done
    mov  (%rdi), %rsi        # reloads cfg->data every iteration -- also never changes!
    add  (%rsi,%rcx,8), %rax
    inc  %rcx
    jmp  .loop
.done:
    ret
```

## Good

```asm
# x86-64 AT&T - load invariant values into registers ONCE, before the loop
.global sum_config
sum_config:
    mov  (%rdi), %rsi        # cfg->data, loaded once
    mov  8(%rdi), %rdx        # cfg->len, loaded once
    xor  %rax, %rax
    xor  %rcx, %rcx
.loop:
    cmp  %rdx, %rcx
    jge  .done
    add  (%rsi,%rcx,8), %rax
    inc  %rcx
    jmp  .loop
.done:
    ret
```

## This Is Exactly What "Loop-Invariant Code Motion" Means

Compilers perform this transformation automatically for values they can prove don't change across the loop; hand-written asm needs to apply the same reasoning manually, especially in cases where aliasing analysis would make a compiler unable to prove the invariant on its own (e.g. `cfg` might alias `data`, something a human writing the asm may know but the compiler can't always prove).

## See Also

- [perf-instruction-level-parallelism](perf-instruction-level-parallelism.md) - Another loop-structuring optimization
- [reg-avoid-redundant-mov](reg-avoid-redundant-mov.md) - The related "don't do avoidable work" principle
- [perf-profile-before-hand-tuning](perf-profile-before-hand-tuning.md) - Confirming memory traffic is actually the bottleneck
