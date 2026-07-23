# reg-lea-arithmetic-trick

> `lea` can compute `a*scale + b` in one flags-free instruction, but document it — it reads like an address, not arithmetic

## Why It Matters

Because `lea`'s addressing-mode encoding computes `base + index*scale + disp`, it can perform multiply-by-{2,3,4,5,8,9}-and-add faster than a separate `imul`/`add` pair, without touching flags. This is a legitimate, widely used optimization, but it looks like a pointer computation to anyone skimming the code, so it needs a comment saying it's arithmetic, not memory addressing.

## Bad (Undocumented)

```asm
# x86-64 AT&T - looks like address computation, is actually pure math
.global scale_and_add
scale_and_add:
    lea (%rdi,%rdi,2), %rax   # what does this compute? not obvious at a glance
    ret
```

## Good

```asm
# x86-64 AT&T - lea used as a multiply-by-3 trick, clearly commented
.global scale_and_add
# int64_t scale_and_add(int64_t x) { return x * 3; }
scale_and_add:
    lea  (%rdi,%rdi,2), %rax   # rax = x + x*2 = x*3  (arithmetic, not an address)
    ret
```

## More lea Arithmetic Idioms

```asm
# x86-64 AT&T
lea (%rdi,%rdi), %rax       # rax = x * 2
lea (%rdi,%rdi,4), %rax     # rax = x * 5
lea 1(%rdi,%rdi,8), %rax    # rax = x * 9 + 1
lea (%rdi,%rsi), %rax       # rax = x + y  (add without touching flags)
```

## When Not to Use This Trick

Prefer a plain `imul $N, %reg, %dst` when N isn't one of the {2,3,4,5,8,9} scale-friendly constants, or when clarity matters more than the one-instruction saving — most compilers only emit this idiom in code the optimizer generates, not in hand-written asm meant to stay readable.

## See Also

- [reg-lea-address-compute](reg-lea-address-compute.md) - The primary, address-computation use of lea
- [doc-bit-trick-explain](doc-bit-trick-explain.md) - Documenting non-obvious tricks like this one
- [perf-branch-free-arithmetic](perf-branch-free-arithmetic.md) - Other arithmetic-over-branching tricks
