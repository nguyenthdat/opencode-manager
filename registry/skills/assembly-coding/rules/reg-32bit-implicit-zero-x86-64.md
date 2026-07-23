# reg-32bit-implicit-zero-x86-64

> Writing a 32-bit register on x86-64 automatically zero-extends into the full 64-bit register

## Why It Matters

Unlike 8-bit and 16-bit writes (which leave the rest of the register untouched), any instruction that writes a 32-bit destination register on x86-64 clears the upper 32 bits of the corresponding 64-bit register as a side effect of the architecture. Knowing this lets you avoid redundant zero-extension instructions — and not knowing it leads to writing unnecessary code, or worse, assuming the same holds for 8/16-bit writes (it does not).

## Bad (Redundant)

```asm
# x86-64 AT&T - unnecessary explicit zero-extension after a 32-bit write
.global load_u32
load_u32:
    mov    (%rdi), %eax     # already zero-extends into rax
    movzlq %eax, %rax        # redundant: upper 32 bits of rax are already 0
    ret
```

## Good

```asm
# x86-64 AT&T - rely on the implicit zero-extension
.global load_u32
load_u32:
    mov (%rdi), %eax        # eax loaded; rax's upper 32 bits are now guaranteed 0
    ret                       # caller can safely use the full 64-bit rax
```

## This Does NOT Apply to 8/16-bit Writes

```asm
# x86-64 AT&T - writing al/ax does NOT clear the upper bits of rax; contrast with eax
mov (%rdi), %al    # only bits 0-7 of rax are defined; bits 8-63 are stale
mov (%rdi), %eax   # bits 0-31 defined; bits 32-63 of rax are now guaranteed 0
```

## Not True on ARM64/RISC-V

ARM64's `Wn`/`Xn` views and RISC-V's `xN` registers do not follow this exact rule (ARM64 writing a `Wn` register does zero the upper 32 bits of `Xn`, matching x86-64's behavior; RISC-V has no sub-register views at all — every general register is always the full XLEN width). Never assume 8/16-bit x86 write semantics apply on other ISAs; the concepts are architecture-specific.

## See Also

- [reg-movzx-zero-extend](reg-movzx-zero-extend.md) - Explicit zero-extension for 8/16-bit sources
- [reg-partial-register-stall](reg-partial-register-stall.md) - The performance cost of relying on partial-register history
- [reg-arm64-w-x-registers](reg-arm64-w-x-registers.md) - The equivalent ARM64 rule
