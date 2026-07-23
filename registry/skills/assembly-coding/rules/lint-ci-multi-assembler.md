# lint-ci-multi-assembler

> When portability across assemblers genuinely matters, run the same source through every supported assembler/version combination in CI, not just the primary one a developer happens to use locally

## Why It Matters

Directive support, warning behavior, and even instruction-encoding choices can differ subtly between assembler versions (a newer GAS supporting a directive an older one rejects, NASM and GAS disagreeing on an edge-case directive semantic). A project that claims to support multiple assemblers or a range of versions but only ever tests with whatever the primary developer has installed locally will eventually break for someone using a different, equally "supported" combination.

## Bad (Single Assembler/Version Tested)

```yaml
# .github/workflows/ci.yml - only ever builds with whatever GAS ships on the CI image by default
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: make
```

## Good

```yaml
# .github/workflows/ci.yml - matrix build across every assembler/version combination the project supports
jobs:
  build:
    strategy:
      matrix:
        assembler: [gas, nasm]
        include:
          - assembler: gas
            install: sudo apt-get install -y binutils
          - assembler: nasm
            install: sudo apt-get install -y nasm
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ${{ matrix.install }}
      - name: Build with ${{ matrix.assembler }}
        run: make ASSEMBLER=${{ matrix.assembler }}
      - name: Run tests
        run: make test ASSEMBLER=${{ matrix.assembler }}
```

## Also Testing Against a Minimum-Supported Version

If the project documents a minimum supported assembler version (analogous to an MSRV for Rust), pin one CI job to exactly that version to catch accidental reliance on a newer-only directive or feature:

```yaml
      - name: Build with minimum-supported GAS version
        run: |
          # install the specific minimum binutils version the project claims to support
          make
```

## See Also

- [syntax-nasm-vs-gas-directives](syntax-nasm-vs-gas-directives.md) - The directive differences this CI matrix is meant to catch
- [test-cross-platform-ci](test-cross-platform-ci.md) - The complementary multi-ISA CI matrix
- [proj-versioned-abi-comment](proj-versioned-abi-comment.md) - Documenting exactly which combinations are actually supported
