# anti-backticks

> Use `$()` over backticks for command substitution

## Why It Matters

Backticks (`` `cmd` ``) are the legacy syntax for command substitution. `$()` is superior in every way: it nests without escaping (`$(echo $(date))` vs `` `echo \`date\`` ``), handles backslashes consistently, and is more readable. Backticks are deprecated in modern shell style and flagged by ShellCheck.

## Bad

```bash
# Backticks — hard to nest, hard to read
result=`command`
nested=`echo \`date\``        # Escaping backticks — ugly and fragile
path=`cd \`dirname "$0"\` && pwd`  # Nightmare to read
```

## Good

```bash
# $() — clean, nestable, readable
result="$(command)"
nested="$(echo "$(date)")"
path="$(cd "$(dirname "$0")" && pwd)"

# Complex nesting — trivial with $()
files="$(find "$(git rev-parse --show-toplevel)" -name "*.sh")"

# Multiple substitutions
output="$(echo "User: $(whoami), Dir: $(pwd), Time: $(date)")"
```

## See Also

- [var-always-quote](./var-always-quote.md) - Quote command substitution results
- [fn-return-values](./fn-return-values.md) - Using $() for function output
