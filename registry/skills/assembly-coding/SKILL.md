---
name: assembly-coding
description: "Comprehensive assembly language guidance: 166 prioritized rules across 15 categories covering x86-64 (AT&T/GAS and Intel/NASM syntax), ARM64/AArch64 (AAPCS64), and RISC-V. Use when writing, reviewing, refactoring, or debugging `.s`/`.asm`/`.S` files, inline asm blocks, calling-convention/ABI code, SIMD (SSE/AVX/NEON/RVV) routines, or any hand-written machine-code-adjacent logic. Covers calling conventions, register discipline, memory addressing/alignment, control flow, syntax pitfalls (AT&T vs Intel operand order), C/asm interop, testing, and toolchain integration."
compatibility: opencode
metadata:
  domain: assembly
  audience: software-engineer
  edition: project-declared
---

# Assembly Best Practices

Comprehensive guide for writing correct, portable, and maintainable assembly language code. Contains 166 rules across 15 categories, prioritized by impact. Assembly has no compiler-enforced types, ownership, or error handling — correctness instead rests on calling-convention discipline, register and memory-addressing precision, and toolchain verification. Project constraints override generic defaults: preserve the target ISA(s), ABI, assembler, and syntax convention the project has already declared unless the user explicitly asks to change them.

## When to Apply

Reference these guidelines when:
- Writing new hand-written routines in x86-64, ARM64/AArch64, or RISC-V assembly
- Reviewing `.s`/`.asm`/`.S` files or inline `asm`/`asm volatile` blocks in C/C++
- Implementing or auditing a calling-convention boundary (SysV AMD64, AAPCS64, RISC-V, Windows x64)
- Writing or reviewing SIMD-optimized code (SSE/AVX, NEON, RVV)
- Debugging a crash or wrong-answer bug that traces into hand-written asm
- Porting a routine between x86-64, ARM64, and RISC-V
- Setting up or reviewing a build system that assembles `.s`/`.asm` files alongside C/C++
- Auditing a binary's security-relevant properties (NX, PIE, stack canary) where hand-written asm is in the mix

## Choosing an ISA and Syntax

Most projects target one or more of three ISA families, each with its own calling convention and idioms:

- **x86-64** — the dominant server/desktop ISA. Two competing syntaxes exist for the *same* instruction set: **AT&T** (GNU assembler/GAS default, used on Linux/BSD/macOS toolchains, `%register`/`$immediate` sigils) and **Intel** (NASM, MASM, and Intel's own documentation, no sigils, `dword ptr`-style size annotations). **Operand order is the single biggest gotcha**: AT&T orders operands `src, dst`; Intel orders them `dst, src`. The exact same two operands in the exact same registers mean opposite things depending on which syntax you're reading — see `syntax-att-operand-order`.
- **ARM64/AArch64** — the dominant mobile/embedded/increasingly-server ISA (Apple Silicon, AWS Graviton, most phones). Effectively one dominant syntax (GNU/Clang assembler, AAPCS64 calling convention), a load/store-only architecture (no memory-to-memory arithmetic), and NEON SIMD is part of the mandatory baseline.
- **RISC-V** — an open, modular ISA gaining ground in embedded and increasingly server contexts. No flags register (branches compare two registers directly), ABI role names (`a0`-`a7`, `s0`-`s11`) layered over raw `x0`-`x31` registers, and an optional, length-agnostic Vector ("V") extension rather than fixed-width SIMD registers.

When a target isn't specified, default to matching whatever ISA/syntax the surrounding project already uses (check existing `.s`/`.asm` files, build scripts, and `doc-abi-assumption-comment`-style header comments) rather than picking a favorite. When writing genuinely new, portable logic, prefer showing the x86-64 AT&T, ARM64, and (where it adds value) RISC-V forms side by side, since a reader of any one variant benefits from seeing how the same logic maps onto the others.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Calling Conventions & ABI | CRITICAL | `abi-` | 14 |
| 2 | Registers & Data Movement | CRITICAL | `reg-` | 13 |
| 3 | Memory Addressing & Alignment | CRITICAL | `mem-` | 14 |
| 4 | Control Flow | HIGH | `ctrl-` | 12 |
| 5 | Syntax & Toolchain | HIGH | `syntax-` | 13 |
| 6 | Interop with C/High-Level Languages | HIGH | `interop-` | 12 |
| 7 | SIMD & Vectorization | HIGH | `simd-` | 10 |
| 8 | Naming Conventions | MEDIUM | `name-` | 8 |
| 9 | Testing & Verification | MEDIUM | `test-` | 10 |
| 10 | Documentation | MEDIUM | `doc-` | 8 |
| 11 | Performance Patterns | MEDIUM | `perf-` | 10 |
| 12 | Safety & Correctness | MEDIUM/HIGH | `safe-` | 10 |
| 13 | Project Structure | LOW | `proj-` | 9 |
| 14 | Linting/Static Analysis | LOW | `lint-` | 8 |
| 15 | Anti-patterns | REFERENCE | `anti-` | 15 |

---

## Quick Reference

### 1. Calling Conventions & ABI (CRITICAL)

- [`abi-sysv-amd64-args`](rules/abi-sysv-amd64-args.md) - System V AMD64 arg registers: rdi, rsi, rdx, rcx, r8, r9
- [`abi-aapcs64-args`](rules/abi-aapcs64-args.md) - ARM64 AAPCS64 arg registers: x0-x7
- [`abi-riscv-args`](rules/abi-riscv-args.md) - RISC-V arg registers: a0-a7 (aliases for x10-x17)
- [`abi-stack-alignment-call`](rules/abi-stack-alignment-call.md) - Keep rsp 16-byte aligned at every `call`
- [`abi-red-zone`](rules/abi-red-zone.md) - Using the 128-byte red zone safely (leaf functions only)
- [`abi-callee-saved-regs`](rules/abi-callee-saved-regs.md) - Save/restore callee-saved registers you modify
- [`abi-caller-saved-regs`](rules/abi-caller-saved-regs.md) - Never assume caller-saved registers survive a call
- [`abi-return-value-regs`](rules/abi-return-value-regs.md) - Return values: rax / x0 / a0 (and wide pairs)
- [`abi-large-struct-return`](rules/abi-large-struct-return.md) - Hidden-pointer convention for large aggregate returns
- [`abi-varargs-al`](rules/abi-varargs-al.md) - Set al to the vector-register count for SysV variadic calls
- [`abi-stack-frame-prologue`](rules/abi-stack-frame-prologue.md) - Standard, symmetric prologue/epilogue setup
- [`abi-leaf-function-omit-frame`](rules/abi-leaf-function-omit-frame.md) - Skip frame setup in true leaf functions
- [`abi-float-regs-separate`](rules/abi-float-regs-separate.md) - Float/vector args use a separate register file
- [`abi-syscall-convention`](rules/abi-syscall-convention.md) - Direct syscalls use a different register mapping than calls

### 2. Registers & Data Movement (CRITICAL)

- [`reg-lea-address-compute`](rules/reg-lea-address-compute.md) - Use `lea` for address computation, not memory access
- [`reg-lea-arithmetic-trick`](rules/reg-lea-arithmetic-trick.md) - `lea` as a documented multiply/add trick
- [`reg-movzx-zero-extend`](rules/reg-movzx-zero-extend.md) - Use `movzx` to zero-extend narrower loads correctly
- [`reg-movsx-sign-extend`](rules/reg-movsx-sign-extend.md) - Use `movsx`/`movsxd` to sign-extend correctly
- [`reg-32bit-implicit-zero-x86-64`](rules/reg-32bit-implicit-zero-x86-64.md) - 32-bit writes auto-zero-extend to 64-bit
- [`reg-arm64-w-x-registers`](rules/reg-arm64-w-x-registers.md) - Wn vs Xn register views on ARM64
- [`reg-riscv-x-registers`](rules/reg-riscv-x-registers.md) - RISC-V ABI register names over raw x0-x31
- [`reg-avoid-redundant-mov`](rules/reg-avoid-redundant-mov.md) - Eliminate register moves that add no value
- [`reg-partial-register-stall`](rules/reg-partial-register-stall.md) - Avoid partial-register write/read stalls
- [`reg-xor-zero-idiom`](rules/reg-xor-zero-idiom.md) - Use `xor reg,reg` to zero a register on x86
- [`reg-arm64-zero-register`](rules/reg-arm64-zero-register.md) - ARM64's xzr/wzr hardwired zero register
- [`reg-riscv-zero-register`](rules/reg-riscv-zero-register.md) - RISC-V's x0/zero hardwired zero register
- [`reg-flags-clobber-awareness`](rules/reg-flags-clobber-awareness.md) - Track which instructions clobber flags

### 3. Memory Addressing & Alignment (CRITICAL)

- [`mem-x86-addressing-modes`](rules/mem-x86-addressing-modes.md) - x86-64 base+index*scale+displacement addressing
- [`mem-arm64-addressing-modes`](rules/mem-arm64-addressing-modes.md) - ARM64 base+offset / shifted-register addressing
- [`mem-riscv-addressing-modes`](rules/mem-riscv-addressing-modes.md) - RISC-V base+12-bit-immediate addressing only
- [`mem-natural-alignment`](rules/mem-natural-alignment.md) - Align data to its own size (2/4/8/16 bytes)
- [`mem-arm64-alignment-fault`](rules/mem-arm64-alignment-fault.md) - ARM64 exclusive/SIMD ops can fault on misalignment
- [`mem-x86-unaligned-penalty`](rules/mem-x86-unaligned-penalty.md) - x86 tolerates misalignment but pays a penalty
- [`mem-stack-16byte-call`](rules/mem-stack-16byte-call.md) - Track running stack alignment as an invariant
- [`mem-struct-field-padding`](rules/mem-struct-field-padding.md) - Compute offsets from real (padded) struct layout
- [`mem-endianness-explicit`](rules/mem-endianness-explicit.md) - Handle byte order explicitly across boundaries
- [`mem-align-directive`](rules/mem-align-directive.md) - Use `.balign`/`.p2align`, not ambiguous `.align`
- [`mem-array-index-scale`](rules/mem-array-index-scale.md) - Match the addressing scale to the element size
- [`mem-rip-relative`](rules/mem-rip-relative.md) - RIP-relative addressing for PIC on x86-64
- [`mem-arm64-adrp-adr`](rules/mem-arm64-adrp-adr.md) - `adrp`+`add` to reach a symbol's address on ARM64
- [`mem-cache-line-alignment`](rules/mem-cache-line-alignment.md) - Align hot shared data to 64-byte cache lines

### 4. Control Flow (HIGH)

- [`ctrl-flags-after-arith`](rules/ctrl-flags-after-arith.md) - Know exactly which flags each instruction sets
- [`ctrl-cmp-vs-test`](rules/ctrl-cmp-vs-test.md) - `test` for zero/mask checks, `cmp` for relational checks
- [`ctrl-signed-vs-unsigned-jcc`](rules/ctrl-signed-vs-unsigned-jcc.md) - Pick the signed vs unsigned jump family
- [`ctrl-cmov-branchless`](rules/ctrl-cmov-branchless.md) - Use `cmov`/`csel` to avoid unpredictable branches
- [`ctrl-loop-unroll-tradeoff`](rules/ctrl-loop-unroll-tradeoff.md) - Measure before unrolling; handle the remainder
- [`ctrl-jump-table`](rules/ctrl-jump-table.md) - Implement dense switches as bounds-checked jump tables
- [`ctrl-arm64-cbz-cbnz`](rules/ctrl-arm64-cbz-cbnz.md) - Single-instruction zero-comparison branches on ARM64
- [`ctrl-riscv-branch-immediate`](rules/ctrl-riscv-branch-immediate.md) - RISC-V's flagless register-to-register branches
- [`ctrl-avoid-mispredict-hot-loop`](rules/ctrl-avoid-mispredict-hot-loop.md) - Structure hot loops for predictable branches
- [`ctrl-tail-call-jmp`](rules/ctrl-tail-call-jmp.md) - Replace `call`+`ret` with `jmp` in tail position
- [`ctrl-loop-counter-direction`](rules/ctrl-loop-counter-direction.md) - Count down to fold the exit test into the decrement
- [`ctrl-short-circuit-branches`](rules/ctrl-short-circuit-branches.md) - Order checks cheapest/most-likely-to-fail first

### 5. Syntax & Toolchain (HIGH)

- [`syntax-att-operand-order`](rules/syntax-att-operand-order.md) - AT&T is src,dst; Intel is dst,src
- [`syntax-att-immediate-percent`](rules/syntax-att-immediate-percent.md) - AT&T requires `$`/`%` sigils
- [`syntax-intel-size-directives`](rules/syntax-intel-size-directives.md) - Intel's `dword ptr`-style size annotation
- [`syntax-att-suffix-size`](rules/syntax-att-suffix-size.md) - AT&T mnemonic suffixes (b/w/l/q) encode size
- [`syntax-section-directives`](rules/syntax-section-directives.md) - Correct use of `.text`/`.data`/`.bss`/`.rodata`
- [`syntax-global-visibility`](rules/syntax-global-visibility.md) - Mark externally-callable symbols with `.global`
- [`syntax-pic-pie-default`](rules/syntax-pic-pie-default.md) - Write position-independent code by default
- [`syntax-equ-named-constants`](rules/syntax-equ-named-constants.md) - Use `.equ`/`%define` over magic numbers
- [`syntax-local-vs-global-symbols`](rules/syntax-local-vs-global-symbols.md) - `.L`-prefix internal-only labels
- [`syntax-nasm-vs-gas-directives`](rules/syntax-nasm-vs-gas-directives.md) - NASM-to-GAS directive mapping
- [`syntax-consistent-syntax-per-file`](rules/syntax-consistent-syntax-per-file.md) - Never mix AT&T and Intel in one file
- [`syntax-gas-intel-syntax-directive`](rules/syntax-gas-intel-syntax-directive.md) - Using `.intel_syntax noprefix` deliberately
- [`syntax-assembler-directive-portability`](rules/syntax-assembler-directive-portability.md) - Don't assume directives port across assemblers

### 6. Interop with C/High-Level Languages (HIGH)

- [`interop-extended-asm-basic`](rules/interop-extended-asm-basic.md) - Use extended `asm` with input/output/clobber lists
- [`interop-clobber-list-complete`](rules/interop-clobber-list-complete.md) - Declare every register the asm block modifies
- [`interop-asm-volatile-side-effects`](rules/interop-asm-volatile-side-effects.md) - Mark asm `volatile` when it has side effects
- [`interop-name-mangling-c`](rules/interop-name-mangling-c.md) - Match C (not C++ mangled) symbol names
- [`interop-c-callable-wrapper`](rules/interop-c-callable-wrapper.md) - Expose asm through a clean C-callable signature
- [`interop-preserve-caller-state`](rules/interop-preserve-caller-state.md) - Leave every non-scratch register/stack state untouched
- [`interop-symbol-naming-underscore`](rules/interop-symbol-naming-underscore.md) - Platform leading-underscore symbol conventions
- [`interop-inline-asm-constraints`](rules/interop-inline-asm-constraints.md) - Choose the correct GCC/Clang constraint letter
- [`interop-asm-memory-clobber`](rules/interop-asm-memory-clobber.md) - Add a `"memory"` clobber for hidden memory effects
- [`interop-plt-got-external-calls`](rules/interop-plt-got-external-calls.md) - Call externals through the PLT/GOT under PIC
- [`interop-struct-layout-agreement`](rules/interop-struct-layout-agreement.md) - Keep asm offsets synced with C struct layout
- [`interop-callback-function-pointers`](rules/interop-callback-function-pointers.md) - Invoke C function pointers ABI-correctly

### 7. SIMD & Vectorization (HIGH)

- [`simd-sse-basic-xmm`](rules/simd-sse-basic-xmm.md) - Basic SSE packed operations using xmm registers
- [`simd-avx-ymm-256`](rules/simd-avx-ymm-256.md) - AVX 256-bit ymm registers, with `vzeroupper`
- [`simd-neon-basic-vector`](rules/simd-neon-basic-vector.md) - Basic ARM64 NEON vector operations
- [`simd-riscv-vector-extension`](rules/simd-riscv-vector-extension.md) - RISC-V "V" extension, length-agnostic vectors
- [`simd-alignment-requirement`](rules/simd-alignment-requirement.md) - Match aligned vs unaligned SIMD load/store to reality
- [`simd-vzeroupper-transition`](rules/simd-vzeroupper-transition.md) - `vzeroupper` before calling non-AVX-aware code
- [`simd-data-layout-soa`](rules/simd-data-layout-soa.md) - Structure-of-Arrays layout for effective vectorization
- [`simd-horizontal-vs-vertical`](rules/simd-horizontal-vs-vertical.md) - Prefer vertical ops; reduce horizontally once
- [`simd-masked-operations`](rules/simd-masked-operations.md) - Masked/predicated SIMD for remainder handling
- [`simd-fallback-scalar-path`](rules/simd-fallback-scalar-path.md) - Always ship a runtime-selected scalar fallback

### 8. Naming Conventions (MEDIUM)

- [`name-label-snake-case`](rules/name-label-snake-case.md) - Descriptive snake_case routine labels
- [`name-local-label-dot-L`](rules/name-local-label-dot-L.md) - `.L`-prefix internal-only jump labels
- [`name-global-symbol-verb-noun`](rules/name-global-symbol-verb-noun.md) - verb_noun naming for exported routines
- [`name-section-name-standard`](rules/name-section-name-standard.md) - Stick to standard section names
- [`name-constant-screaming-snake`](rules/name-constant-screaming-snake.md) - SCREAMING_SNAKE_CASE for `.equ` constants
- [`name-register-alias-descriptive`](rules/name-register-alias-descriptive.md) - Alias registers descriptively in long routines
- [`name-file-per-arch-suffix`](rules/name-file-per-arch-suffix.md) - Suffix per-ISA files (`_x86_64.s`, `_arm64.s`)
- [`name-avoid-reserved-mnemonics`](rules/name-avoid-reserved-mnemonics.md) - Never name symbols like mnemonics/registers

### 9. Testing & Verification (MEDIUM)

- [`test-c-harness-wrapper`](rules/test-c-harness-wrapper.md) - Test asm via a small C harness calling its ABI boundary
- [`test-gdb-register-inspect`](rules/test-gdb-register-inspect.md) - Step and inspect registers/memory with gdb
- [`test-lldb-register-inspect`](rules/test-lldb-register-inspect.md) - The lldb equivalent on macOS/BSD
- [`test-disassemble-verify`](rules/test-disassemble-verify.md) - Disassemble and confirm the actual encoded bytes
- [`test-compare-compiler-output`](rules/test-compare-compiler-output.md) - Diff against `gcc -S`/`clang -S` for idiom checks
- [`test-fuzz-via-wrapper`](rules/test-fuzz-via-wrapper.md) - Fuzz asm indirectly through its C wrapper
- [`test-unit-test-known-vectors`](rules/test-unit-test-known-vectors.md) - Cover zero, max, negative, and empty inputs
- [`test-sanitizer-wrapper`](rules/test-sanitizer-wrapper.md) - Run the C harness under ASan/UBSan
- [`test-golden-file-disasm`](rules/test-golden-file-disasm.md) - Snapshot disassembly to catch codegen drift
- [`test-cross-platform-ci`](rules/test-cross-platform-ci.md) - Test every targeted ISA in CI, real or emulated

### 10. Documentation (MEDIUM)

- [`doc-entry-register-contract`](rules/doc-entry-register-contract.md) - Document each routine's register/stack contract
- [`doc-clobber-comment`](rules/doc-clobber-comment.md) - Comment which registers a routine clobbers
- [`doc-frame-layout-comment`](rules/doc-frame-layout-comment.md) - Document hand-managed stack frame layouts
- [`doc-bit-trick-explain`](rules/doc-bit-trick-explain.md) - Explain non-obvious bit tricks with the underlying math
- [`doc-abi-assumption-comment`](rules/doc-abi-assumption-comment.md) - State the assumed ABI/OS/syntax at the file top
- [`doc-algorithm-reference`](rules/doc-algorithm-reference.md) - Cite the algorithm/reference a routine implements
- [`doc-section-purpose-comment`](rules/doc-section-purpose-comment.md) - Comment the purpose of each data section/blob
- [`doc-todo-fixme-tracked`](rules/doc-todo-fixme-tracked.md) - Track unfinished/unsafe shortcuts with tracked comments

### 11. Performance Patterns (MEDIUM)

- [`perf-avoid-false-dependency`](rules/perf-avoid-false-dependency.md) - Break false register dependencies
- [`perf-instruction-level-parallelism`](rules/perf-instruction-level-parallelism.md) - Expose independent work for ILP
- [`perf-avoid-self-modifying-code`](rules/perf-avoid-self-modifying-code.md) - Never modify executing instructions
- [`perf-cache-line-access-pattern`](rules/perf-cache-line-access-pattern.md) - Access memory sequentially where possible
- [`perf-avoid-lock-prefix-uncontended`](rules/perf-avoid-lock-prefix-uncontended.md) - Reserve `lock` for genuinely shared state
- [`perf-string-op-rep-movsb`](rules/perf-string-op-rep-movsb.md) - `rep movsb`/`stosb` for large copies, measured
- [`perf-minimize-memory-traffic`](rules/perf-minimize-memory-traffic.md) - Keep loop-invariant values in registers
- [`perf-branch-free-arithmetic`](rules/perf-branch-free-arithmetic.md) - Replace simple branches with mask arithmetic
- [`perf-prefetch-hint`](rules/perf-prefetch-hint.md) - Software-prefetch predictable-but-non-sequential access
- [`perf-profile-before-hand-tuning`](rules/perf-profile-before-hand-tuning.md) - Profile before hand-optimizing anything

### 12. Safety & Correctness (MEDIUM/HIGH)

- [`safe-stack-overflow-bounds`](rules/safe-stack-overflow-bounds.md) - Never write past allocated stack space
- [`safe-stack-canary-respect`](rules/safe-stack-canary-respect.md) - Never bypass or "fix" the compiler's stack canary
- [`safe-integer-overflow-manual`](rules/safe-integer-overflow-manual.md) - Check OF/CF after manual arithmetic
- [`safe-no-undocumented-flag-reliance`](rules/safe-no-undocumented-flag-reliance.md) - Only rely on documented flag guarantees
- [`safe-return-address-integrity`](rules/safe-return-address-integrity.md) - Never clobber the return address / link register
- [`safe-shadow-space-windows`](rules/safe-shadow-space-windows.md) - Reserve the 32-byte Windows x64 shadow space
- [`safe-nx-stack-no-exec`](rules/safe-nx-stack-no-exec.md) - Never execute code from non-executable memory
- [`safe-division-by-zero-check`](rules/safe-division-by-zero-check.md) - Guard `div`/`idiv` against a zero divisor
- [`safe-signed-division-truncation`](rules/safe-signed-division-truncation.md) - Sign-extend (`cqo`/`cdq`) before signed division
- [`safe-uninitialized-register-read`](rules/safe-uninitialized-register-read.md) - Never read before writing/initializing

### 13. Project Structure (LOW)

- [`proj-separate-text-data-bss`](rules/proj-separate-text-data-bss.md) - Consistent `.text`/`.data`/`.bss` organization
- [`proj-one-routine-per-file-large`](rules/proj-one-routine-per-file-large.md) - Split large modules by cohesive purpose
- [`proj-makefile-integration`](rules/proj-makefile-integration.md) - Wire `.s`/`.S` sources into a Makefile properly
- [`proj-cmake-asm-language`](rules/proj-cmake-asm-language.md) - Enable CMake's `ASM`/`ASM_NASM` languages
- [`proj-per-arch-directory-layout`](rules/proj-per-arch-directory-layout.md) - Organize per-ISA implementations by directory
- [`proj-header-shared-constants`](rules/proj-header-shared-constants.md) - One source of truth for C/asm shared constants
- [`proj-build-both-syntaxes`](rules/proj-build-both-syntaxes.md) - Maintain dual AT&T/Intel variants only when justified
- [`proj-versioned-abi-comment`](rules/proj-versioned-abi-comment.md) - Document supported platforms at the project level
- [`proj-avoid-vendoring-generated-asm`](rules/proj-avoid-vendoring-generated-asm.md) - Don't hand-patch compiler-generated asm

### 14. Linting/Static Analysis (LOW)

- [`lint-assembler-warnings-as-errors`](rules/lint-assembler-warnings-as-errors.md) - `as --fatal-warnings` in the build
- [`lint-nasm-w-all`](rules/lint-nasm-w-all.md) - NASM's `-Wall`/`-Werror` warning discipline
- [`lint-objdump-cross-check`](rules/lint-objdump-cross-check.md) - Make disassembly review a routine review step
- [`lint-static-analyzer-compiler-asm`](rules/lint-static-analyzer-compiler-asm.md) - Compare against compiler-idiomatic output
- [`lint-checksec-binary`](rules/lint-checksec-binary.md) - Verify NX/PIE/canary flags on the final binary
- [`lint-consistent-indentation-style`](rules/lint-consistent-indentation-style.md) - Consistent mnemonic/operand column alignment
- [`lint-no-dead-code-sections`](rules/lint-no-dead-code-sections.md) - Remove unused labels/routines, don't comment them out
- [`lint-ci-multi-assembler`](rules/lint-ci-multi-assembler.md) - Test every supported assembler/version in CI

### 15. Anti-patterns (REFERENCE)

- [`anti-hardcoded-stack-offset`](rules/anti-hardcoded-stack-offset.md) - Don't hardcode undocumented stack offsets
- [`anti-assume-register-allocation`](rules/anti-assume-register-allocation.md) - Don't assume a register role without checking the ABI
- [`anti-ignore-alignment-requirement`](rules/anti-ignore-alignment-requirement.md) - Don't ignore call-boundary alignment rules
- [`anti-self-modifying-code`](rules/anti-self-modifying-code.md) - Don't write self-modifying code
- [`anti-mixed-syntax`](rules/anti-mixed-syntax.md) - Don't mix AT&T and Intel syntax carelessly
- [`anti-premature-hand-optimization`](rules/anti-premature-hand-optimization.md) - Don't hand-optimize before profiling a working C version
- [`anti-clobber-callee-saved`](rules/anti-clobber-callee-saved.md) - Don't clobber a callee-saved register unrestored
- [`anti-missing-red-zone-awareness`](rules/anti-missing-red-zone-awareness.md) - Don't assume the red zone is safe in non-leaf functions
- [`anti-magic-number-offset`](rules/anti-magic-number-offset.md) - Don't use unexplained magic-number offsets
- [`anti-ignoring-endianness`](rules/anti-ignoring-endianness.md) - Don't ignore byte order when porting/parsing data
- [`anti-unbounded-string-op`](rules/anti-unbounded-string-op.md) - Don't run `rep`/loop copies without a verified bound
- [`anti-forgetting-vzeroupper`](rules/anti-forgetting-vzeroupper.md) - Don't skip `vzeroupper` at the AVX/SSE boundary
- [`anti-copy-paste-abi-mismatch`](rules/anti-copy-paste-abi-mismatch.md) - Don't copy x86-64 ABI assumptions into ARM64/RISC-V
- [`anti-unsynced-flags-across-calls`](rules/anti-unsynced-flags-across-calls.md) - Don't assume flags survive a function call
- [`anti-no-verification-of-hand-asm`](rules/anti-no-verification-of-hand-asm.md) - Don't ship hand-written asm unverified

---

## Recommended Tooling & Build Configuration

```bash
# GNU assembler (GAS) + linker, AT&T syntax, warnings as errors, debug symbols
as --fatal-warnings -g -o checksum.o checksum.s
ld -o app checksum.o main.o

# GCC/Clang driving the whole pipeline (preferred for most projects: handles PIC/PIE,
# links libc, and runs the C preprocessor over .S files automatically)
gcc -Wall -Wextra -Wa,--fatal-warnings -g -fPIC -pie -c checksum.s -o checksum.o
gcc -fPIC -pie checksum.o main.o -o app

# NASM (Intel syntax), warnings as errors, debug info, ELF64 object format
nasm -f elf64 -Wall -Werror -g checksum.asm -o checksum.o
gcc checksum.o main.o -o app
```

```makefile
# Makefile snippet: assembling .s files alongside C, with debug symbols and warnings enabled
CC       := gcc
AS       := as
CFLAGS   := -Wall -Wextra -g -O2 -fPIC -pie
ASFLAGS  := -g --fatal-warnings

SRCS_C   := main.c parser.c
SRCS_S   := checksum_x86_64.s
OBJS     := $(SRCS_C:.c=.o) $(SRCS_S:.s=.o)

app: $(OBJS)
	$(CC) $(CFLAGS) $(OBJS) -o $@

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

%.o: %.s
	$(AS) $(ASFLAGS) $< -o $@

test: app
	./run_tests.sh

clean:
	rm -f $(OBJS) app

.PHONY: test clean
```

Verify the shipped binary's security-relevant properties once the build is wired up:

```bash
checksec --file=./app   # confirms NX, PIE, RELRO, and stack-canary status
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing assembly code:

1. **Identify the target ISA(s) and syntax** — check existing files, build scripts, or ask if unclear
2. **Check the relevant category** based on the task type
3. **Apply rules** with the matching prefix, showing multi-ISA variants where the skill covers more than one
4. **Prioritize** CRITICAL > HIGH > MEDIUM > LOW
5. **Read rule files** in `rules/` for detailed, ISA-labeled examples

### Rule Application by Task

| Task | Primary Categories |
|------|-------------------|
| New routine, any ISA | `abi-`, `reg-`, `mem-` |
| Calling-convention boundary / C interop | `abi-`, `interop-` |
| Hot loop / branch structuring | `ctrl-`, `perf-` |
| SIMD / vectorized code | `simd-`, `mem-`, `perf-` |
| Porting between x86-64/ARM64/RISC-V | `abi-`, `reg-`, `mem-`, `anti-copy-paste-abi-mismatch` |
| Debugging a crash or wrong answer | `test-`, `safe-`, `doc-` |
| Build system integration | `proj-`, `syntax-` |
| Code review | `anti-`, `lint-`, `safe-` |

---

## Related Skills

- [c-coding](../c-coding/SKILL.md) - assembly work is very often paired with C, via inline `asm`/`asm volatile` blocks, `extern "C"` linkage boundaries, and shared struct layouts; see this skill's `interop-` category for the seams between the two.
- [design-patterns](../design-patterns/SKILL.md) - architectural patterns for the higher-level code that calls into hand-written asm routines.
- [security-review](../security-review/SKILL.md) - broader security-audit checklists; this skill's `safe-` category and `lint-checksec-binary` cover the asm-specific slice (stack canaries, NX, PIE) of that same concern.

## Sources

This skill synthesizes best practices from:
- Intel® 64 and IA-32 Architectures Software Developer's Manuals
- AMD64 Architecture Programmer's Manual
- System V Application Binary Interface, AMD64 Architecture Processor Supplement
- Arm Architecture Reference Manual for A-profile architecture; Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64)
- RISC-V Instruction Set Manual; RISC-V ELF psABI specification
- "Programming from the Ground Up" — Jonathan Bartlett
- "Modern X86 Assembly Language Programming" — Daniel Kusswurm
- OSDev Wiki
- GNU Binutils (`as`, `ld`, `objdump`) and NASM documentation
- Community conventions and production open-source assembly (glibc, Linux kernel, zlib, compiler-generated codegen idioms) (2024-2025)
