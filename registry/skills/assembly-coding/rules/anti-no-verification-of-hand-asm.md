# anti-no-verification-of-hand-asm

> Don't ship hand-written asm without test coverage, disassembly review, or any other form of verification

## Why It Matters

Hand-written asm has none of the safety nets a high-level language provides (no type checking, no bounds checking, no memory-safety guarantees, no compiler warnings about likely mistakes) — the entire burden of catching a wrong register, a missing bounds check, or a calling-convention violation falls on deliberate verification. Shipping it unverified is a much higher-risk bet than shipping unverified high-level code.

## Bad

```
src/
  parse_header.s     # written once, assembled successfully, never tested, never disassembled-reviewed,
                       # shipped directly because "it looked right"
```

## Good

```
src/
  parse_header.s
  parse_header.h
test/
  test_parse_header.c        # C harness with known-vector and boundary-case tests
  fuzz_parse_header.c          # fuzz target through the same C wrapper
.github/workflows/ci.yml          # runs tests, disassembly golden-file check, and sanitizer builds
```

```bash
# Minimum verification checklist before shipping hand-written asm
as --fatal-warnings parse_header.s -o parse_header.o    # clean assembly, warnings as errors
objdump -d parse_header.o                                  # disassembly reviewed
gcc -fsanitize=address,undefined test_parse_header.c parse_header.o -o test && ./test  # tested, sanitized
```

## "It Assembled Without Errors" Is Not Verification

A common but mistaken justification for skipping verification is that the assembler accepted the file without complaint — but a clean assembly only confirms the syntax was well-formed, not that the logic is correct, that the calling convention was honored, or that every edge case (empty input, maximum-size input, misaligned input) behaves as intended. None of those are things an assembler checks.

## The Minimum Bar, Restated

At minimum, before merging or shipping hand-written asm: it should assemble with warnings treated as errors, its disassembly should have been read and matched against intent at least once, and it should be exercised by a C test harness covering at least the boundary cases described in `test-unit-test-known-vectors` — anything less leaves correctness resting entirely on "it looked right," which is not a verification method.

## Escalating Verification for Higher-Risk Code

Routines that parse untrusted input, perform security-sensitive computation, or are widely reused across a codebase warrant the fuller verification stack described throughout this skill's `test-` category: fuzzing through the C wrapper, sanitizer builds, and cross-platform CI — reserve the "just tested with a few known vectors" bar for small, low-risk, easily-reviewed routines.

## See Also

- [test-c-harness-wrapper](test-c-harness-wrapper.md) - The minimum testing practice this anti-pattern skips
- [test-disassemble-verify](test-disassemble-verify.md) - The disassembly review this anti-pattern skips
- [doc-todo-fixme-tracked](doc-todo-fixme-tracked.md) - At minimum, tracking known-unverified shortcuts explicitly
- [test-fuzz-via-wrapper](test-fuzz-via-wrapper.md) - Escalated verification for higher-risk routines
- [test-sanitizer-wrapper](test-sanitizer-wrapper.md) - Sanitizer-backed verification for memory-safety-sensitive code
