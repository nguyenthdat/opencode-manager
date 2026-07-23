# test-ci-matrix-compilers

> Run the test suite in CI across multiple compilers (GCC and Clang, at minimum) and at least two C standard versions

## Why It Matters

Undefined behavior and implementation-defined behavior can compile clean and pass tests on one compiler while misbehaving on another — a portable-looking bug that only one toolchain happens to "get away with." Testing across GCC and Clang (and, if the project targets it, MSVC) at multiple optimization levels surfaces exactly this class of latent bug long before a user's different toolchain does.

## Bad

```yaml
# Single compiler, single standard version, single optimization level:
# only ever tests one specific interpretation of the code.
- run: gcc -O2 -o test_bin test.c src/*.c && ./test_bin
```

## Good

```yaml
# .github/workflows/ci.yml (excerpt)
strategy:
  matrix:
    compiler: [gcc, clang]
    std: [c99, c17]
    optimization: ["-O0", "-O2"]
steps:
  - run: |
      ${{ matrix.compiler }} -std=${{ matrix.std }} ${{ matrix.optimization }} \
        -Wall -Wextra -Wpedantic -Werror \
        -o test_bin test.c src/*.c
  - run: ./test_bin
```

## Why Multiple Optimization Levels Matter Specifically

Undefined behavior often only manifests at `-O2`/`-O3`, where the compiler is more aggressive about exploiting UB-based assumptions (e.g., eliminating a signed-overflow check). Code that only gets tested at `-O0` can hide UB that becomes a real, user-visible bug the moment a release build (typically `-O2`) is shipped.

## See Also

- [lint-enable-wall-wextra-wpedantic](lint-enable-wall-wextra-wpedantic.md) - The warning flags to combine with this matrix
- [test-sanitizers-in-test-ci](test-sanitizers-in-test-ci.md) - Sanitizer builds as additional matrix legs
- [ub-signed-integer-overflow](ub-signed-integer-overflow.md) - An example of UB that varies by optimization level
