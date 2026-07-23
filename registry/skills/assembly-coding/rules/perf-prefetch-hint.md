# perf-prefetch-hint

> Issue a software prefetch a few iterations ahead of a predictable-but-not-sequential access pattern to hide memory latency

## Why It Matters

Hardware prefetchers handle simple sequential and fixed-stride patterns well on their own, but an access pattern that's predictable to the programmer (e.g. following a linked structure whose next address is already known a few steps ahead) but not to the hardware prefetcher can still benefit from an explicit `prefetcht0`/`prfm` instruction issued early enough to hide the memory latency behind other useful work.

## Bad (No Prefetch, Latency Fully Exposed)

```asm
# x86-64 AT&T - each iteration stalls waiting for the load, latency fully exposed
.global sum_strided_wrong
sum_strided_wrong:
    xor  %rax, %rax
    xor  %rcx, %rcx
.loop:
    cmp  %rsi, %rcx
    jge  .done
    add  (%rdi,%rcx,8), %rax    # stalls here waiting for memory, every iteration
    add  $16, %rcx                # stride of 16 elements: not simple enough for some prefetchers
    jmp  .loop
.done:
    ret
```

## Good (Prefetch Several Iterations Ahead)

```asm
# x86-64 AT&T - prefetch the data this loop will need several iterations from now
.global sum_strided
sum_strided:
    xor  %rax, %rax
    xor  %rcx, %rcx
.loop:
    cmp  %rsi, %rcx
    jge  .done
    prefetcht0 512(%rdi,%rcx,8)   # hint: bring in data ~4 iterations ahead into L1
    add  (%rdi,%rcx,8), %rax
    add  $16, %rcx
    jmp  .loop
.done:
    ret
```

## Choosing the Right Prefetch Distance and Level

`prefetcht0` targets all cache levels (closest to the core); `prefetcht1`/`prefetcht2` target progressively further-out levels for data that will be used less soon. The correct prefetch distance (how many iterations ahead) depends on memory latency and loop body length — too close wastes the hint, too far evicts it before use. This requires measurement, not guesswork.

## ARM64 Equivalent

```asm
// ARM64 - prfm hints the memory system similarly
prfm pldl1keep, [x0, #512]    // prefetch for load, L1, keep (not streaming)
```

## Prefetching Is a Measured Optimization, Not a Default

A poorly-tuned prefetch distance can hurt performance (extra instructions, cache pollution, prefetching data that's evicted before use) more than it helps — always validate with a benchmark on representative data before keeping a prefetch hint in hot code.

## See Also

- [perf-cache-line-access-pattern](perf-cache-line-access-pattern.md) - The broader cache-access-pattern context this serves
- [perf-profile-before-hand-tuning](perf-profile-before-hand-tuning.md) - Measuring before and after adding prefetch hints
- [mem-cache-line-alignment](mem-cache-line-alignment.md) - Related cache-conscious data layout
