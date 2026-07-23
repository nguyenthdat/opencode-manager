---
name: bash-coding
description: "Comprehensive idiomatic Bash/POSIX Shell guidance: 134 prioritized rules across 12 categories. Use when writing, reviewing, refactoring, or debugging shell scripts (`.sh`, `.bash`, `#!/bin/bash`, `#!/bin/sh`). Covers variable handling/quoting, error handling (errexit/pipefail), I/O and redirection, portability (POSIX sh vs Bash), security (injection/suid), function design, testing (Bats/shellspec), and anti-patterns. Target Bash 5.x+; distinguish Bash-isms from POSIX sh for portable scripts."
compatibility: opencode
metadata:
  domain: bash
  audience: software-engineer
  edition: bash-5
---

# Bash / Shell Best Practices

Comprehensive guide for writing high-quality, idiomatic, and robust Bash/POSIX shell scripts. Contains 134 rules across 12 categories, prioritized by impact to guide LLMs in code generation and refactoring.

## When to Apply

Reference these guidelines when:
- Writing new Bash scripts or shell functions
- Reviewing shell scripts for correctness and security
- Debugging variable scoping, quoting, or exit code issues
- Refactoring legacy shell scripts to modern standards
- Writing scripts that must run on both Linux and macOS
- Choosing between Bash features and POSIX-compatible alternatives
- Setting up CI/CD with ShellCheck and Bats testing
- Handling user input, secrets, or temporary files securely

## Bash 5.x & Modern Shell Features

This skill targets **Bash 5.x** (released 2019) while noting POSIX compatibility. Key features to leverage:

- **Associative arrays** (`declare -A`): string-keyed maps for configuration, caching, dispatch tables (Bash 4.0+)
- **Namerefs** (`declare -n`, `local -n`): safe indirect variable/array access, replacing `eval` (Bash 4.3+)
- **Process substitution** (`<(cmd)`, `>(cmd)`): pipe without subshells, preserve variable state (Bash 4.0+)
- **Here-strings** (`<<<`): single-string stdin without pipes or forks (Bash 4.0+)
- **`[[ ]]` conditional**: regex matching (`=~`), pattern matching (`==`), safe unquoted variables
- **`globstar`** (`shopt -s globstar`): recursive `**/*.txt` glob patterns (Bash 4.0+)
- **`nullglob`** / **`failglob`**: control glob behavior for empty matches
- **`extglob`**: extended patterns (`@()`, `!()`, `+()`, `*()`, `?()`)
- **`readarray`/`mapfile`**: read file/command output directly into arrays
- **`BASH_REMATCH`**: capture regex groups from `[[ =~ ]]` matching
- **`EPOCHSECONDS`** / **`EPOCHREALTIME`**: wall-clock timestamps without `date` fork (Bash 5.0+)
- **`BASH_SOURCE` vs `$0`**: reliably determine script location regardless of how it's invoked
- **Subshell vs command grouping**: `(cmd)` is a subshell (variable changes lost), `{ cmd; }` is in-process

For POSIX sh (`#!/bin/sh`, `dash`, `ash`, `busybox sh`), avoid all of the above and see [port-avoid-bashisms](rules/port-avoid-bashisms.md).

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Variable Handling & Quoting | CRITICAL | `var-` | 14 |
| 2 | Error Handling & Exit Codes | CRITICAL | `err-` | 13 |
| 3 | Input/Output & Redirection | HIGH | `io-` | 12 |
| 4 | Security | HIGH | `sec-` | 11 |
| 5 | Function Design | HIGH | `fn-` | 11 |
| 6 | Portability (POSIX vs Bash) | HIGH | `port-` | 11 |
| 7 | Naming & Style Conventions | MEDIUM | `name-` | 11 |
| 8 | Arrays & Data Structures | MEDIUM | `arr-` | 9 |
| 9 | Testing (Bats/shellspec) | MEDIUM | `test-` | 10 |
| 10 | Debugging & Logging | MEDIUM | `debug-` | 9 |
| 11 | Performance & Efficiency | MEDIUM | `perf-` | 9 |
| 12 | Anti-patterns | REFERENCE | `anti-` | 14 |

---

## Quick Reference

### 1. Variable Handling & Quoting (CRITICAL)

- [`var-always-quote`](rules/var-always-quote.md) - Always quote variable expansions: `"$var"` not `$var`
- [`var-brace-variables`](rules/var-brace-variables.md) - Use `${var}` for disambiguation and clarity
- [`var-default-values`](rules/var-default-values.md) - Use `${var:-default}` and `${var:=default}` for defaults
- [`var-local-in-functions`](rules/var-local-in-functions.md) - Declare function variables with `local`
- [`var-readonly-constants`](rules/var-readonly-constants.md) - Use `readonly` or `declare -r` for constants
- [`var-uppercase-env`](rules/var-uppercase-env.md) - UPPER_CASE for environment variables and globals
- [`var-null-vs-unset`](rules/var-null-vs-unset.md) - Use `${var+isset}` vs `${var-unset}` for existence checks
- [`var-indirect-reference`](rules/var-indirect-reference.md) - Use `declare -n` (nameref) instead of `eval`
- [`var-no-eval-expand`](rules/var-no-eval-expand.md) - Never use `eval` for variable expansion
- [`var-arrays-cautious`](rules/var-arrays-cautious.md) - Use arrays for lists; don't misuse strings with spaces
- [`var-no-glob-wordsplitting`](rules/var-no-glob-wordsplitting.md) - Set IFS carefully; disable word splitting for safety
- [`var-prefix-suffix-remove`](rules/var-prefix-suffix-remove.md) - Use `${var#prefix}`, `${var%suffix}`, `${var//pattern/replacement}`
- [`var-length-count`](rules/var-length-count.md) - Use `${#var}` for string length, `${#arr[@]}` for array size
- [`var-avoid-export-in-loop`](rules/var-avoid-export-in-loop.md) - Don't export variables inside loops unnecessarily

### 2. Error Handling & Exit Codes (CRITICAL)

- [`err-errexit-set`](rules/err-errexit-set.md) - Use `set -euo pipefail` at top of scripts
- [`err-pipefail-required`](rules/err-pipefail-required.md) - Always use `set -o pipefail` to catch pipe errors
- [`err-check-exit-status`](rules/err-check-exit-status.md) - Check `$?` after critical commands
- [`err-trap-errors`](rules/err-trap-errors.md) - Use `trap '...' ERR` for error handling
- [`err-trap-exit-cleanup`](rules/err-trap-exit-cleanup.md) - Use `trap '...' EXIT` for cleanup
- [`err-meaningful-exit`](rules/err-meaningful-exit.md) - Exit with meaningful non-zero codes
- [`err-avoid-ignore-errors`](rules/err-avoid-ignore-errors.md) - Don't use `|| true` to ignore errors without comment
- [`err-command-exists`](rules/err-command-exists.md) - Check `command -v` before using external tools
- [`err-set-e-cautious`](rules/err-set-e-cautious.md) - Understand `set -e` edge cases in conditionals
- [`err-no-unchecked-cd`](rules/err-no-unchecked-cd.md) - Always check `cd` success: `cd dir || exit 1`
- [`err-mkdir-parent`](rules/err-mkdir-parent.md) - Use `mkdir -p` to avoid "already exists" errors
- [`err-return-over-exit-fn`](rules/err-return-over-exit-fn.md) - Use `return` in functions, `exit` only at top level
- [`err-dry-run-pattern`](rules/err-dry-run-pattern.md) - Support `--dry-run` in destructive scripts

### 3. Input/Output & Redirection (HIGH)

- [`io-heredoc-quote`](rules/io-heredoc-quote.md) - Quote heredoc delimiter to prevent expansion: `<<'EOF'`
- [`io-stderr-redirect`](rules/io-stderr-redirect.md) - Redirect stderr explicitly: `2>/dev/null` or `2>&1`
- [`io-read-while-pipe`](rules/io-read-while-pipe.md) - Use `while IFS= read -r line` pattern correctly
- [`io-process-substitution`](rules/io-process-substitution.md) - Use `<(cmd)` and `>(cmd)` for piping without subshells
- [`io-avoid-cat-pipe`](rules/io-avoid-cat-pipe.md) - Avoid `cat file | cmd`; use `cmd < file` or `cmd file`
- [`io-file-descriptor-management`](rules/io-file-descriptor-management.md) - Use `exec` for custom file descriptors
- [`io-here-string`](rules/io-here-string.md) - Use `<<<` for simple string input
- [`io-tempfile-safely`](rules/io-tempfile-safely.md) - Use `mktemp` for temporary files; never hardcode `/tmp`
- [`io-null-dev-null`](rules/io-null-dev-null.md) - Use `/dev/null` explicitly; avoid writing to stdout
- [`io-read-r-preserve`](rules/io-read-r-preserve.md) - Use `read -r` to preserve backslashes
- [`io-no-binary-in-pipe`](rules/io-no-binary-in-pipe.md) - Don't pipe binary data through text processing
- [`io-buffered-flush`](rules/io-buffered-flush.md) - Use `stdbuf` or `unbuffer` when needed for line-buffered pipes

### 4. Security (HIGH)

- [`sec-no-unquoted-expansion`](rules/sec-no-unquoted-expansion.md) - Quote all shell expansions to prevent word splitting/glob
- [`sec-no-eval-user`](rules/sec-no-eval-user.md) - Never use `eval` with user-supplied input
- [`sec-sanitize-input`](rules/sec-sanitize-input.md) - Validate and sanitize user input before use
- [`sec-path-injection`](rules/sec-path-injection.md) - Never trust `$PATH`; use absolute paths or set PATH explicitly
- [`sec-no-exec-user-test`](rules/sec-no-exec-user-test.md) - Don't use user input in command names
- [`sec-tempfile-race`](rules/sec-tempfile-race.md) - Use `mktemp` to avoid TOCTOU races
- [`sec-suid-cautious`](rules/sec-suid-cautious.md) - Avoid setuid shell scripts; use `sudo` instead
- [`sec-secrets-in-env`](rules/sec-secrets-in-env.md) - Pass secrets via environment, never CLI args
- [`sec-no-hardcoded-secrets`](rules/sec-no-hardcoded-secrets.md) - Use environment variables or secret managers for credentials
- [`sec-umask-restrictive`](rules/sec-umask-restrictive.md) - Set `umask 077` for scripts handling sensitive data
- [`sec-shellcheck-required`](rules/sec-shellcheck-required.md) - Run `shellcheck` on all shell scripts

### 5. Function Design (HIGH)

- [`fn-return-values`](rules/fn-return-values.md) - Capture function output with `$(...)`; use `return` for status
- [`fn-argument-count`](rules/fn-argument-count.md) - Check `$#` for required argument count
- [`fn-argument-names`](rules/fn-argument-names.md) - Name function arguments at top: `local name=$1`
- [`fn-main-function`](rules/fn-main-function.md) - Put main logic in `main()` function; call at end
- [`fn-pure-when-possible`](rules/fn-pure-when-possible.md) - Write functions that don't depend on global state
- [`fn-small-focused`](rules/fn-small-focused.md) - Keep functions small and single-purpose
- [`fn-no-side-effects`](rules/fn-no-side-effects.md) - Minimize side effects; document globals modified
- [`fn-usage-help`](rules/fn-usage-help.md) - Provide `usage()` function with help text
- [`fn-option-parsing`](rules/fn-option-parsing.md) - Use `getopts` for argument parsing; avoid manual `$1` `$2` loops
- [`fn-library-source`](rules/fn-library-source.md) - Source library scripts; don't copy-paste functions
- [`fn-lowercase-names`](rules/fn-lowercase-names.md) - Use lowercase function names (POSIX namespace safety)

### 6. Portability (POSIX vs Bash) (HIGH)

- [`port-shebang-choice`](rules/port-shebang-choice.md) - Use `#!/usr/bin/env bash` for Bash; `#!/bin/sh` for POSIX
- [`port-avoid-bashisms`](rules/port-avoid-bashisms.md) - Avoid `[[ ]]`, arrays, `${!ref}`, `source`, `==` in POSIX sh scripts
- [`port-posix-test`](rules/port-posix-test.md) - Use `[ ]` instead of `[[ ]]` when portability matters
- [`port-printf-over-echo`](rules/port-printf-over-echo.md) - Use `printf` instead of `echo` for portable output
- [`port-no-local-posix`](rules/port-no-local-posix.md) - Don't use `local` in POSIX sh (Bash-ism)
- [`port-command-v-which`](rules/port-command-v-which.md) - Use `command -v` over `which` for command checking
- [`port-readlink-realpath`](rules/port-readlink-realpath.md) - Don't assume `readlink -f` / `realpath` is available
- [`port-sed-i-portable`](rules/port-sed-i-portable.md) - Use `sed -i.bak` for portable in-place editing
- [`port-array-alternatives`](rules/port-array-alternatives.md) - Use IFS-delimited strings when arrays aren't available
- [`port-shellcheck-directive`](rules/port-shellcheck-directive.md) - Use ShellCheck directives for bash-only scripts
- [`port-coproc-portable`](rules/port-coproc-portable.md) - Document Bash-specific features when used

### 7. Naming & Style Conventions (MEDIUM)

- [`name-variables-uppercase-env`](rules/name-variables-uppercase-env.md) - UPPER_CASE for environment/export variables
- [`name-variables-lowercase-local`](rules/name-variables-lowercase-local.md) - lowercase_with_underscores for local vars
- [`name-functions-lowercase`](rules/name-functions-lowercase.md) - lowercase function names; avoid UpperCase
- [`name-constants-readonly`](rules/name-constants-readonly.md) - `readonly VARIABLE_NAME` for constants
- [`name-files-kebab-case`](rules/name-files-kebab-case.md) - Use kebab-case.sh for script file names
- [`name-library-prefix`](rules/name-library-prefix.md) - Prefix library functions with namespace_ (e.g., `log_info`)
- [`name-boolean-true-false`](rules/name-boolean-true-false.md) - Use 0/1 for boolean return values
- [`name-descriptive-vars`](rules/name-descriptive-vars.md) - Use descriptive variable names; avoid a, b, c, x
- [`name-no-reserved-words`](rules/name-no-reserved-words.md) - Avoid bash keywords as function/variable names
- [`name-globals-caps`](rules/name-globals-caps.md) - UPPER_CASE for globals in scripts
- [`name-temp-vars-prefix`](rules/name-temp-vars-prefix.md) - Prefix temp variables with `_` to mark as internal

### 8. Arrays & Data Structures (MEDIUM)

- [`arr-declare-arrays`](rules/arr-declare-arrays.md) - Use `declare -a` for indexed, `declare -A` for associative
- [`arr-expand-properly`](rules/arr-expand-properly.md) - Use `"${arr[@]}"` to expand arrays with proper quoting
- [`arr-iterate-keys`](rules/arr-iterate-keys.md) - Iterate associative array keys with `"${!arr[@]}"`
- [`arr-append-elements`](rules/arr-append-elements.md) - Use `arr+=("new")` to append to arrays
- [`arr-length-count`](rules/arr-length-count.md) - Use `${#arr[@]}` for array length
- [`arr-no-spaces-in-keys`](rules/arr-no-spaces-in-keys.md) - Use sensible keys for associative arrays
- [`arr-pass-to-function`](rules/arr-pass-to-function.md) - Pass arrays by name with `declare -n` (nameref)
- [`arr-slice-subset`](rules/arr-slice-subset.md) - Use `${arr[@]:offset:length}` for array slicing
- [`arr-read-into-array`](rules/arr-read-into-array.md) - Use `readarray`/`mapfile` for reading lines into array

### 9. Testing (Bats/shellspec) (MEDIUM)

- [`test-bats-framework`](rules/test-bats-framework.md) - Use Bats (Bash Automated Testing System) for testing
- [`test-run-helper`](rules/test-run-helper.md) - Use Bats `run` helper to capture output and status
- [`test-assert-output`](rules/test-assert-output.md) - Use `[ "$output" = "expected" ]` and `[ "$status" -eq 0 ]`
- [`test-setup-teardown`](rules/test-setup-teardown.md) - Use `setup()` and `teardown()` for test fixtures
- [`test-mock-commands`](rules/test-mock-commands.md) - Override functions or use stub scripts for mocking
- [`test-temp-dirs`](rules/test-temp-dirs.md) - Create and clean test directories in setup/teardown
- [`test-one-assertion`](rules/test-one-assertion.md) - Test one behavior per test case
- [`test-skip-not-installed`](rules/test-skip-not-installed.md) - Skip tests when dependencies not installed
- [`test-shellcheck-build`](rules/test-shellcheck-build.md) - Run ShellCheck as part of the test suite
- [`test-ci-integration`](rules/test-ci-integration.md) - Output TAP format for CI integration

### 10. Debugging & Logging (MEDIUM)

- [`debug-set-x-trace`](rules/debug-set-x-trace.md) - Use `set -x` for command tracing; wrap in subshell
- [`debug-ps4-enhanced`](rules/debug-ps4-enhanced.md) - Set enhanced PS4 for file:line:function traces
- [`debug-trap-debug`](rules/debug-trap-debug.md) - Use `trap '...' DEBUG` for custom debugging
- [`debug-log-function`](rules/debug-log-function.md) - Write a `log()` function with timestamps and levels
- [`debug-verbose-flag`](rules/debug-verbose-flag.md) - Support `--verbose`/`-v` flag for debug output
- [`debug-no-echo-debug`](rules/debug-no-echo-debug.md) - Use stderr for debug, stdout for program output
- [`debug-assert-function`](rules/debug-assert-function.md) - Create `assert()` helper for runtime checks
- [`debug-color-output`](rules/debug-color-output.md) - Use `tput` or ANSI codes; check if output is terminal
- [`debug-stack-trace`](rules/debug-stack-trace.md) - Print stack trace in ERR trap with `caller`

### 11. Performance & Efficiency (MEDIUM)

- [`perf-avoid-fork`](rules/perf-avoid-fork.md) - Use builtins (`[[ ]]`, `${var##}`, `printf`) to avoid subshell forks
- [`perf-avoid-cat-useless`](rules/perf-avoid-cat-useless.md) - Avoid useless use of cat (UUOC)
- [`perf-inline-grep`](rules/perf-inline-grep.md) - Use Bash pattern matching over `grep` when possible
- [`perf-batch-process`](rules/perf-batch-process.md) - Batch operations: `git` commands, database queries
- [`perf-parallel-xargs`](rules/perf-parallel-xargs.md) - Use `xargs -P` for parallel execution
- [`perf-avoid-subshell-loop`](rules/perf-avoid-subshell-loop.md) - Don't pipe into `while`; use process substitution
- [`perf-here-string-speed`](rules/perf-here-string-speed.md) - Here-strings (`<<<`) are faster than `echo |` pipe
- [`perf-glob-over-find`](rules/perf-glob-over-find.md) - Use glob patterns over `find` for simple directory walks
- [`perf-cache-results`](rules/perf-cache-results.md) - Cache expensive command results in variables

### 12. Anti-patterns (REFERENCE)

- [`anti-unquoted-variables`](rules/anti-unquoted-variables.md) - Never leave variable expansions unquoted
- [`anti-eval-everything`](rules/anti-eval-everything.md) - Don't use `eval`; find builtin alternatives
- [`anti-bare-variable-in-test`](rules/anti-bare-variable-in-test.md) - Don't use `[ $var = "value" ]` on empty var
- [`anti-pipe-while-subshell`](rules/anti-pipe-while-subshell.md) - Don't modify variables in pipe `while` loops (subshell issue)
- [`anti-ls-in-for`](rules/anti-ls-in-for.md) - Never use `for f in $(ls)`; use globs: `for f in *`
- [`anti-backticks`](rules/anti-backticks.md) - Use `$()` over backticks for command substitution
- [`anti-newlines-in-names`](rules/anti-newlines-in-names.md) - Don't create files/vars with spaces or newlines
- [`anti-cd-without-check`](rules/anti-cd-without-check.md) - Always check `cd` success
- [`anti-echo-in-function-output`](rules/anti-echo-in-function-output.md) - Don't echo debug info in functions that return data
- [`anti-global-variable-everywhere`](rules/anti-global-variable-everywhere.md) - Don't use global variables for everything
- [`anti-source-without-path`](rules/anti-source-without-path.md) - Don't `source` scripts without specifying path
- [`anti-single-brackets-bash`](rules/anti-single-brackets-bash.md) - Don't use `[ ]` for compound tests in Bash (use `[[ ]]`)
- [`anti-rm-rf-asterisk-danger`](rules/anti-rm-rf-asterisk-danger.md) - Never use `rm -rf $VAR/*` without validating `$VAR`
- [`anti-interactive-suppress`](rules/anti-interactive-suppress.md) - Don't use `yes |` in scripts; handle interaction properly

---

## Recommended Shell Settings

```bash
#!/usr/bin/env bash
# Safer bash defaults — include at top of every script
set -euo pipefail
IFS=$'\n\t'

# Additional safety options (opt-in)
shopt -s nullglob          # Non-matching globs → empty (not literal *)
shopt -s inherit_errexit   # Subshells inherit errexit (Bash 4.4+)
shopt -s shift_verbose     # shift errors when count exceeds $#

# For debuggable scripts:
# shopt -s failglob        # Non-matching globs → error (stricter than nullglob)
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing shell scripts:

1. **Check relevant category** based on task type
2. **Apply rules** with matching prefix
3. **Prioritize** CRITICAL > HIGH > MEDIUM > REFERENCE
4. **Read rule files** in `rules/` for detailed examples with Bad/Good code

### Rule Application by Task

| Task | Primary Categories |
|------|-------------------|
| New script skeleton | `err-`, `fn-`, `name-` |
| Variable handling | `var-`, `sec-` |
| Function writing | `fn-`, `var-` |
| File/pipe processing | `io-`, `perf-` |
| Security review | `sec-`, `anti-` |
| Cross-platform script | `port-`, `name-` |
| Test writing | `test-`, `debug-` |
| Debugging failures | `debug-`, `err-` |
| Code review | `anti-`, `sec-` |

---

## Related Skills

- [design-patterns](../design-patterns/SKILL.md) — choosing and implementing GoF/idiomatic patterns in shell scripts (pipeline/filter, command dispatch).
- [security-review](../security-review/SKILL.md) — cross-language security/correctness review methodology (phases, finding format, severity guidance) applies to shell-script reviews; it does not yet ship a dedicated shell bug-class reference file, so apply the general workflow to injection, unsafe `eval`/word-splitting, and TOCTOU risks.

## Sources

This skill synthesizes best practices from:
- [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)
- [ShellCheck Wiki](https://www.shellcheck.net/wiki/)
- [Bash Hackers Wiki](https://wiki.bash-hackers.org/)
- [Wooledge BashGuide](https://mywiki.wooledge.org/BashGuide)
- [POSIX Shell Command Language](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html)
- Production codebases: Git, Docker, Homebrew, various CI/CD pipelines
- Community conventions and ShellCheck diagnostics
