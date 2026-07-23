# port-avoid-bashisms

> Avoid `[[ ]]`, arrays, `${!ref}`, `source`, `==` in POSIX sh scripts

## Why It Matters

POSIX shells (dash, ash, BusyBox sh) don't support many Bash features. Using Bash-isms in a script with `#!/bin/sh` shebang causes cryptic errors on systems where `/bin/sh` is a minimal POSIX shell (Debian/Ubuntu use dash). Stick to POSIX features for maximum portability across all Unix systems.

## Bad

```bash
#!/bin/sh
# Full of bashisms — breaks on dash/ash!

[[ -f "$file" ]]           # [[ is Bash-specific

declare -a items=(a b c)   # Arrays are Bash

echo "${!var}"              # Indirect expansion is Bash

source ./lib.sh             # source is a synonym for . (but . is POSIX)

[ "$a" == "$b" ]            # == is a Bash extension; POSIX uses =

function myfunc {           # function keyword is unnecessary and non-POSIX
    local x=1               # local is not POSIX
}

for ((i=0; i<10; i++)); do  # C-style for is Bash
    echo $i
done
```

## Good

```bash
#!/bin/sh
# POSIX-compatible equivalents

[ -f "$file" ]              # [ ] instead of [[ ]]

# No arrays — use IFS-delimited strings or positional params
set -- a b c
for item in "$@"; do
    echo "$item"
done

# No indirect expansion — use eval (carefully) or restructure
# eval "value=\$$varname"   # Only with trusted variable names

. ./lib.sh                  # . instead of source

[ "$a" = "$b" ]             # Single = for comparison

myfunc() {                  # No function keyword
    _myfunc_x=1             # No local; use naming convention
}

i=0
while [ "$i" -lt 10 ]; do   # POSIX-compatible loop
    echo "$i"
    i=$((i + 1))
done
```

## Bash-ism → POSIX Cheat Sheet

| Bash | POSIX |
|------|-------|
| `[[ -f "$f" ]]` | `[ -f "$f" ]` |
| `[[ "$a" =~ ^[0-9]+$ ]]` | `echo "$a" \| grep -qE '^[0-9]+$'` |
| `declare -a arr=(a b)` | `set -- a b` |
| `${!var}` | `eval "echo \$$var"` (careful!) |
| `source file` | `. file` |
| `local x=1` | `_funcname_x=1` |
| `for ((i=0;i<n;i++))` | `i=0; while [ $i -lt $n ]; do ... i=$((i+1)); done` |
| `$'string'` | literal or printf |
| `&>` | `>file 2>&1` |
| `<<< "str"` | `echo "str" \| cmd` |

## See Also

- [port-shebang-choice](./port-shebang-choice.md) - Choosing the right shebang
- [port-posix-test](./port-posix-test.md) - Using [ ] over [[ ]]
