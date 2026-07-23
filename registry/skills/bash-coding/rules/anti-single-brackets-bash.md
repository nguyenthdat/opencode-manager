# anti-single-brackets-bash

> Don't use `[ ]` for compound tests in Bash (use `[[ ]]`)

## Why It Matters

`[ ]` (POSIX test) requires careful quoting, doesn't support `&&`/`||` inside a single test, can't do regex matching, and can't do pattern matching. `[[ ]]` (Bash keyword) is safer — no word splitting, supports `&&`/`||` natively, has `=~` for regex, and `==` for pattern matching. In Bash scripts, prefer `[[ ]]` for all but the simplest tests.

## Bad

```bash
#!/usr/bin/env bash
# Using [ ] for complex tests — error-prone

# AND condition requires two separate [ ] calls or -a (deprecated)
if [ "$name" = "admin" -a "$level" -gt 5 ]; then
    :
fi

# Regex not possible with [ ]
if echo "$input" | grep -qE '^[0-9]+$'; then
    :
fi

# Pattern matching not possible
if [ "$file" = *.txt ]; then  # Literal string comparison, not pattern!
    :
fi
```

## Good

```bash
#!/usr/bin/env bash
# [[ ]] for complex tests — safe and powerful

# AND/OR inside single test
if [[ "$name" == "admin" && "$level" -gt 5 ]]; then
    :
fi

# Regex matching
if [[ "$input" =~ ^[0-9]+$ ]]; then
    :
fi

# Pattern matching
if [[ "$file" == *.txt ]]; then
    :
fi

# Safe without quoting (but quote anyway for clarity)
if [[ -f $file ]]; then  # Works, but prefer [[ -f "$file" ]]
    :
fi
```

## When [ ] Is Appropriate

```bash
# 1. POSIX scripts (#!/bin/sh) — [[ ]] doesn't exist
#!/bin/sh
[ "$name" = "admin" ] && [ "$level" -gt 5 ] || exit 1

# 2. Simple single-condition tests where you want POSIX compatibility
[ -f "$file" ] && process "$file"
[ -z "$var" ] && var="default"

# 3. When you're unsure if Bash is available (very rare)
```

## See Also

- [port-posix-test](./port-posix-test.md) - [ ] vs [[ ]] for portability
- [anti-bare-variable-in-test](./anti-bare-variable-in-test.md) - Quoting in tests
