# test-cross-platform-ci

> Run the test suite on real or emulated hardware for every ISA the project targets, in CI, not just the developer's own machine

## Why It Matters

Multi-ISA asm code (x86-64/ARM64/RISC-V variants of the same routine) is exactly the kind of code where "works on my machine" is nearly meaningless — a developer testing only on x86-64 has zero signal about whether the ARM64 or RISC-V variant even assembles correctly, let alone produces correct results. CI matrix builds combined with an emulator (QEMU user-mode) catch this without requiring physical hardware for every architecture.

## Bad (Single-Architecture CI)

```yaml
# .github/workflows/ci.yml - only tests the architecture the CI runner happens to be
jobs:
  test:
    runs-on: ubuntu-latest      # x86-64 only; ARM64/RISC-V variants get zero coverage
    steps:
      - run: make test
```

## Good

```yaml
# .github/workflows/ci.yml - matrix build covering every targeted ISA, using QEMU for cross-arch runs
jobs:
  test:
    strategy:
      matrix:
        arch: [x86_64, aarch64, riscv64]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up cross-toolchain and QEMU user-mode emulation
        run: |
          sudo apt-get update
          sudo apt-get install -y qemu-user gcc-${{ matrix.arch }}-linux-gnu
      - name: Build for ${{ matrix.arch }}
        run: make ARCH=${{ matrix.arch }} CC=${{ matrix.arch }}-linux-gnu-gcc
      - name: Test under QEMU (${{ matrix.arch }} != host)
        run: qemu-${{ matrix.arch }} -L /usr/${{ matrix.arch }}-linux-gnu ./test_checksum
```

## Native Runners Where Available

Prefer native ARM64 CI runners over QEMU emulation when the CI provider offers them (emulation is slower and, rarely, can mask timing-sensitive bugs); reserve QEMU for architectures (like RISC-V) where native CI runners aren't yet widely available.

## What This Catches

- An addressing mode or instruction that assembles fine on one ISA's toolchain but is invalid/misencoded for another
- ABI mismatches only visible when the actual target's calling convention is exercised
- Endianness assumptions baked in without testing on a differently-configured target

## See Also

- [test-golden-file-disasm](test-golden-file-disasm.md) - Per-ISA disassembly snapshots, run as part of this same CI matrix
- [proj-per-arch-directory-layout](proj-per-arch-directory-layout.md) - The source layout this CI matrix builds against
- [simd-fallback-scalar-path](simd-fallback-scalar-path.md) - Ensure the fallback path is tested too, not just the fastest one
