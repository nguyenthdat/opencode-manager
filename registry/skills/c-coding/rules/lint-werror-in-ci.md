# lint-werror-in-ci

> Build with `-Werror` in CI (though not necessarily in every local dev build) so warnings cannot silently accumulate

## Why It Matters

A warning that doesn't fail the build gets ignored — not out of malice, but because build output is noisy and warnings scroll past unread once there are more than a handful. `-Werror` forces every warning to be addressed (fixed or, rarely and explicitly, suppressed with a documented reason) before code merges, which is the only way to keep a warning-free baseline warning-free over time.

## Bad

```yaml
# CI compiles with warnings enabled but doesn't fail on them —
# warnings accumulate indefinitely and are never actually read.
- run: cc -Wall -Wextra -o app main.c
```

## Good

```yaml
- run: cc -std=c17 -Wall -Wextra -Wpedantic -Werror -o app main.c
```

## Local Dev: Warnings Without -Werror, Then -Werror Before Push

```make
# Makefile: -Werror only in the CI target, so local iterative development
# isn't blocked mid-edit by a warning on an intentionally incomplete line
CFLAGS = -std=c17 -Wall -Wextra -Wpedantic

ci: CFLAGS += -Werror
ci: app
```

## Handling a Warning You've Deliberately Decided to Suppress

```c
#if defined(__GNUC__) || defined(__clang__)
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-parameter"
#endif
int callback(int unused_but_required_by_signature) { return 0; }
#if defined(__GNUC__) || defined(__clang__)
#pragma GCC diagnostic pop
#endif
```

Scope any suppression as narrowly as possible (a single function, not a whole file) and leave a comment explaining why it's justified.

## See Also

- [lint-enable-wall-wextra-wpedantic](lint-enable-wall-wextra-wpedantic.md) - The warning set this rule enforces
- [test-ci-matrix-compilers](test-ci-matrix-compilers.md) - Applying `-Werror` across the whole compiler/standard matrix
- [anti-ignoring-compiler-warnings](anti-ignoring-compiler-warnings.md) - What this rule structurally prevents
