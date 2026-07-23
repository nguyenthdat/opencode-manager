# sec-no-unquoted-expansion

> Quote all shell expansions to prevent word splitting and globbing

## Why It Matters

Unquoted expansions are the single biggest source of shell bugs and security vulnerabilities. When a variable containing user input is expanded unquoted, the shell performs word splitting (breaking on IFS characters) and glob expansion (matching `*`, `?`, `[` against filenames). This can lead to command injection, information disclosure, and file manipulation attacks.

## Bad

```bash
# User input with spaces breaks argument count
filename="$user_input"
cat $filename          # User enters "a.txt ; rm -rf /" — not executed but splits

# Glob in user input expands to filenames
pattern="$user_input"
ls $pattern            # User enters "*" — lists all files instead of literal *

# Empty variable removes argument slot
rm $user_file          # If empty: just "rm" — no error, no-op silently
```

## Good

```bash
# Always quote expansions
filename="$user_input"
cat "$filename"         # Single argument, regardless of content

pattern="$user_input"
ls "$pattern"           # Literal string, no glob expansion

# Safe even when empty
rm "$user_file"         # If empty: rm "" — errors gracefully

# Array expansion must be quoted with [@]
files=("$@")
for f in "${files[@]}"; do
    process "$f"
done
```

## Security Impact

```bash
# Vulnerable: unquoted variable in find
find . -name $pattern       # $pattern="*.txt -o -name /etc/passwd" — reads /etc/passwd!

# Safe: quoted
find . -name "$pattern"     # Treats entire string as pattern

# Vulnerable: word splitting in ssh
ssh_args="$command"
ssh $ssh_args               # Splits on spaces

# Safe: use array
ssh_args=(-p "$port" "$user@$host" "$command")
ssh "${ssh_args[@]}"
```

## See Also

- [var-always-quote](./var-always-quote.md) - The fundamental quoting rule
- [sec-no-eval-user](./sec-no-eval-user.md) - Never eval user input
