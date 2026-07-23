# var-always-quote

> Always quote variable expansions: `"$var"` not `$var`

## Why It Matters

Unquoted variable expansions undergo word splitting and glob expansion, splitting values on whitespace and expanding `*`, `?`, and `[` into matching filenames. This is the #1 cause of shell script bugs and security vulnerabilities. Quoting prevents both behaviors, ensuring the variable's value is treated as a single token.

## Bad

```bash
# Word splitting: "my file.txt" becomes two arguments
file="my file.txt"
cat $file          # Expands to: cat my file.txt — two files!

# Globbing: variable containing * expands to all filenames
pattern="*.txt"
echo $pattern      # Prints all .txt files, not the literal "*.txt"

# Empty variable silently disappears, changing positional args
name=""
cp $name dest      # Expands to: cp dest — wrong argument count!

# In test: empty variable causes syntax error
[ $var = "value" ] # If var is empty: [ = "value" ] — FAILS
```

## Good

```bash
# Always quote variable expansions
file="my file.txt"
cat "$file"         # Correct: single argument

pattern="*.txt"
echo "$pattern"     # Prints: *.txt (literal)

name=""
cp "$name" dest     # Expands to: cp "" dest — still two args, explicit

# Quote in tests
[ "$var" = "value" ] # If var is empty: [ "" = "value" ] — correct

# Quote all variable expansions
for f in "$@"; do
    process "$f"
done

# Quote command substitution too
result="$(some_command "$arg")"
echo "$result"
```

## See Also

- [sec-no-unquoted-expansion](./sec-no-unquoted-expansion.md) - Security implications
- [var-no-glob-wordsplitting](./var-no-glob-wordsplitting.md) - Controlling word splitting
- [anti-unquoted-variables](./anti-unquoted-variables.md) - The anti-pattern
