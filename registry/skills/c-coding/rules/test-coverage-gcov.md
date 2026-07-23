# test-coverage-gcov

> Measure test coverage with `gcov`/`llvm-cov` and use it to find untested code paths, not as a target to game

## Why It Matters

Coverage tooling shows exactly which lines and branches your test suite never executes — invaluable for spotting an entire error-handling branch, an edge case, or a whole function that has no tests at all. It is a diagnostic tool for finding gaps, not a quality metric to maximize for its own sake: 100% line coverage says nothing about whether the assertions in those tests are meaningful.

## Bad

```sh
# Coverage never measured; "we have tests" is the only signal available,
# with no visibility into which branches those tests actually exercise.
cc -O2 -o test_bin test.c src/*.c && ./test_bin
```

## Good — GCC + gcov

```sh
cc --coverage -g -O0 -o test_bin test.c src/*.c
./test_bin
gcov src/parser.c            # produces parser.c.gcov annotated with hit counts per line
```

## Good — Clang + llvm-cov (Richer HTML Reports)

```sh
clang -fprofile-instr-generate -fcoverage-mapping -o test_bin test.c src/*.c
LLVM_PROFILE_FILE="test.profraw" ./test_bin
llvm-profdata merge -sparse test.profraw -o test.profdata
llvm-cov show ./test_bin -instr-profile=test.profdata src/parser.c
llvm-cov report ./test_bin -instr-profile=test.profdata   # per-file summary
```

## Reading Coverage Output Usefully

Focus on completely uncovered functions and branches first (a whole error path with zero hits is a red flag), rather than chasing marginal line-percentage increases in code that's already well-tested.

## See Also

- [test-boundary-value-testing](test-boundary-value-testing.md) - Coverage often reveals missing boundary tests specifically
- [test-ci-matrix-compilers](test-ci-matrix-compilers.md) - Running coverage as part of the CI matrix
- [test-sanitizers-in-test-ci](test-sanitizers-in-test-ci.md) - A complementary but distinct CI signal (bugs vs. gaps)
