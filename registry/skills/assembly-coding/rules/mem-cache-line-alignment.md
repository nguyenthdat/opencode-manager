# mem-cache-line-alignment

> Align frequently-shared, hot data to 64-byte cache-line boundaries to avoid false sharing and split cache-line accesses

## Why It Matters

Most modern x86-64 and ARM64 CPUs use 64-byte cache lines. Two independent variables that share a cache line but are written by different CPU cores force the cache-coherency protocol to bounce that line between cores on every write ("false sharing"), which can cost far more than the actual memory access. A single hot variable straddling a cache-line boundary can also double the number of cache-line fetches needed to access it.

## Bad

```asm
# x86-64 AT&T (GAS) - two independently-updated counters packed into the same cache line
.section .data
counter_a: .quad 0    # written by thread A
counter_b: .quad 0    # written by thread B, but shares a 64-byte cache line with counter_a
```

## Good

```asm
# x86-64 AT&T (GAS) - pad so each counter owns its own cache line
.section .data
.balign 64
counter_a: .quad 0
.balign 64
counter_b: .quad 0
```

## Sizing the Padding Correctly

```asm
# x86-64 AT&T (GAS) - explicit padding to fill out a 64-byte line after an 8-byte field
.section .data
.balign 64
counter_a: .quad 0
           .skip 56, 0     # pad remaining 56 bytes so the next symbol starts a new line
counter_b: .quad 0
```

## Confirming the Cache-Line Size on the Target

Do not hardcode 64 blindly for every deployment target; query it when portability across microarchitectures matters:

```bash
# Linux - actual cache-line size for the current CPU
getconf LEVEL1_DCACHE_LINESIZE
cat /sys/devices/system/cpu/cpu0/cache/index0/coherency_line_size
```

## See Also

- [mem-align-directive](mem-align-directive.md) - The alignment directives used here
- [perf-cache-line-access-pattern](perf-cache-line-access-pattern.md) - Broader cache-access-pattern guidance
- [mem-natural-alignment](mem-natural-alignment.md) - Per-type alignment, a finer-grained concern
