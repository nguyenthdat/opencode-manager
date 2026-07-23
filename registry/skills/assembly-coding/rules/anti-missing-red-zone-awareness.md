# anti-missing-red-zone-awareness

> Don't assume the SysV AMD64 red zone is safe to use in a non-leaf function

## Why It Matters

The 128-byte red zone below `%rsp` is only guaranteed undisturbed for leaf functions (ones that call nothing else). Using it as scratch space in a function that then calls another routine invites that callee's own prologue to silently overwrite the "scratch" data, since the callee has no idea the caller was relying on that memory remaining intact.

## Bad

```asm
# x86-64 AT&T - non-leaf function relying on the red zone: UNSAFE
.global process
process:
    mov  %rdi, -8(%rsp)     # "scratch" write in the red zone, no frame allocated
    call helper                # BUG: helper's own prologue can overwrite -8(%rsp)
    mov  -8(%rsp), %rax
    ret
```

## Good

```asm
# x86-64 AT&T - allocate a real frame before calling anything
.global process
process:
    sub  $16, %rsp
    mov  %rdi, 0(%rsp)
    call helper
    mov  0(%rsp), %rax
    add  $16, %rsp
    ret
```

## Why This Bug Often Survives Testing

The corruption depends on exactly what the callee's own prologue happens to write into the region the caller was treating as scratch space — with some callees (or some optimization levels of a callee), the exact bytes the caller needed happen to still be there by coincidence, or the caller reads the corrupted value before it actually matters. A change to the callee (a new local variable, a different optimization level) that shifts its own stack usage can suddenly "break" a caller that was silently relying on undefined behavior, with no change to the caller's own source.

## Interrupt and Signal Handlers Are a Second Way This Bites

Even in an otherwise genuinely leaf-like function, an asynchronous signal handler invoked by the OS can execute using the same stack, at any point, and is not bound by the "leaf function" analysis a human reader performed — some ABI documents explicitly warn that signal handling can invalidate red-zone assumptions in ways ordinary control-flow analysis won't catch, which is one more reason to reserve the red zone strictly for the narrowest, most clearly leaf-only scratch usage.

## The Fix Is Always to Allocate a Real Frame

Any function that calls anything else — including indirectly, through a function pointer whose target isn't statically known to also be leaf — should allocate its own frame rather than reaching for the red zone.

## See Also

- [abi-red-zone](abi-red-zone.md) - The full rule this anti-pattern violates
- [abi-leaf-function-omit-frame](abi-leaf-function-omit-frame.md) - When avoiding a frame actually is safe
- [abi-stack-frame-prologue](abi-stack-frame-prologue.md) - The correct frame setup this anti-pattern skips
- [safe-stack-overflow-bounds](safe-stack-overflow-bounds.md) - The broader discipline of respecting stack memory boundaries
