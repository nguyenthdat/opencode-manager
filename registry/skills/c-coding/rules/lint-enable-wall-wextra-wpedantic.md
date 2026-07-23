# lint-enable-wall-wextra-wpedantic

> Compile every C project with `-Wall -Wextra -Wpedantic` at minimum, as a non-negotiable baseline

## Why It Matters

`-Wall` and `-Wextra` catch a large share of common C mistakes (unused variables, mismatched types, suspicious comparisons, uninitialized-use candidates) at essentially zero cost. `-Wpedantic` additionally flags non-standard extensions and constructs the standard forbids, which matters for portability across compilers and future standard versions. Skipping these is leaving free, immediate bug detection on the table.

## Bad

```sh
cc -o app main.c   # no warnings enabled at all: the compiler silently accepts a wide range of likely bugs
```

## Good

```sh
cc -std=c17 -Wall -Wextra -Wpedantic -o app main.c
```

## What Each Flag Adds

| Flag | Catches |
|------|---------|
| `-Wall` | Unused variables, format mismatches, suspicious `if`/comparison logic, many common bugs |
| `-Wextra` | Signed/unsigned comparisons, unused parameters, missing field initializers, more |
| `-Wpedantic` | Non-standard compiler extensions, strict ISO C conformance issues |

## A Fuller Recommended Baseline

```sh
cc -std=c17 -Wall -Wextra -Wpedantic -Wshadow -Wconversion \
   -Wformat=2 -Wswitch-enum -Wundef -Wcast-align \
   -g -fsanitize=address,undefined -o app main.c
```

Introduce the stricter flags (`-Wconversion`, `-Wshadow`) incrementally on legacy code, since they can surface a large backlog at once — but always enable the full set on new code from day one.

## See Also

- [lint-werror-in-ci](lint-werror-in-ci.md) - Making these warnings build-breaking in CI
- [proj-build-system-cmake-makefile](proj-build-system-cmake-makefile.md) - Wiring these flags into the actual build
- [anti-ignoring-compiler-warnings](anti-ignoring-compiler-warnings.md) - The anti-pattern this rule prevents
