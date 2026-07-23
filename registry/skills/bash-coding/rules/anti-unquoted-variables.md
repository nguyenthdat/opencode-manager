# anti-unquoted-variables

> Never leave variable expansions unquoted

## Why It Matters

Unquoted variable expansions are the #1 cause of shell script bugs. Word splitting breaks values containing spaces into multiple arguments. Glob expansion turns `*`, `?`, and `[` into filename matches. Together, these silently corrupt data, break argument passing, and create security vulnerabilities. Always quote: `"$var"` not `$var`.

## Bad

```bash
filename="$1"
cat $filename       # Splits on spaces, expands globs
rm $temp_dir/*      # What if temp_dir is empty or contains spaces?
[ $var = "yes" ]    # Syntax error if var is empty
```

## Good

```bash
filename="$1"
cat "$filename"          # Single argument regardless of content
rm "${temp_dir:-}"/*     # Safe: quoted variable, :- guard
[ "$var" = "yes" ]       # Correct: handles empty var
```

## See Also

- [var-always-quote](./var-always-quote.md) - The quoting rule
- [sec-no-unquoted-expansion](./sec-no-unquoted-expansion.md) - Security implications
