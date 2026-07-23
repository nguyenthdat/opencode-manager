# reg-partial-register-stall

> Avoid writing a low 8/16-bit register and then reading the full 32/64-bit register shortly after

## Why It Matters

On several x86 microarchitectures, writing a partial register (`al`, `ax`) and then reading the full register (`eax`, `rax`) forces the CPU to either merge the old and new bits (a "merge" penalty) or insert a stall waiting for the partial write to retire, because the processor must track a false dependency on whatever last wrote the untouched upper bits.

## Bad

```asm
# x86-64 AT&T - partial write then full-register read: potential merge stall
.global count_bytes
count_bytes:
    xor  %eax, %eax
.loop:
    cmpb $0, (%rdi,%rax)
    je   .done
    inc  %al              # BUG-prone pattern: 8-bit write to a loop counter
    jmp  .loop
.done:
    ret                     # rax's upper bits depend on the earlier xor, easy to break
```

## Good

```asm
# x86-64 AT&T - operate on the full 32/64-bit register throughout
.global count_bytes
count_bytes:
    xor  %eax, %eax
.loop:
    cmpb $0, (%rdi,%rax)
    je   .done
    inc  %rax               # full-width increment, no partial-register hazard
    jmp  .loop
.done:
    ret
```

## The Zeroing Idiom Avoids the Hazard From the Start

```asm
# x86-64 AT&T - xor-zero the full register before any partial writes if you must use one
xor  %eax, %eax     # breaks any false dependency on the prior value of eax
mov  (%rdi), %al     # now this partial write has a known-zero upper context
```

## This Is Microarchitecture-Dependent

Partial-register penalties vary significantly across Intel and AMD generations; some newer cores handle this well. Prefer full-width operations by default rather than relying on any specific CPU's forwarding behavior, and profile before assuming this is your bottleneck.

## See Also

- [reg-movzx-zero-extend](reg-movzx-zero-extend.md) - Use explicit zero-extension instead of partial writes
- [reg-xor-zero-idiom](reg-xor-zero-idiom.md) - The xor-zero idiom used to break false dependencies
- [perf-avoid-false-dependency](perf-avoid-false-dependency.md) - The general false-dependency problem
