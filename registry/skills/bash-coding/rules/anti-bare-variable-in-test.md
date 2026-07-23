# anti-bare-variable-in-test

> Don't use `[ $var = "value" ]` on empty var

## Why It Matters

When `$var` is empty and unquoted in `[ $var = "value" ]`, it expands to nothing, producing `[ = "value" ]` — a syntax error because `=` expects a left-hand argument. This is the classic "unary operator expected" bash error. Always quote variables in `[ ]` tests: `[ "$var" = "value" ]`. In `[[ ]]`, quoting is unnecessary but still recommended for consistency.

## Bad

```bash
var=""
[ $var = "test" ]      # Error: "=: unary operator expected"
[ $x -eq 5 ]           # Error if x is empty: "-eq: unary operator expected"
[ -n $var ]            # Always true! [ -n ] is string "not empty of -n"

# Works when set, breaks when empty — worst kind of bug
[ $OPTIONAL_VAR = "required_value" ]
```

## Good

```bash
var=""
[ "$var" = "test" ]        # Safe: [ "" = "test" ] — false, no error
[ "$x" -eq 5 ]             # Safe: [ "" -eq 5 ] — proper error message
[ -n "$var" ]               # Correct: empty var = false

# [[ ]] doesn't have this issue but quoting is still good practice
[[ $var == "test" ]]       # Works (but quote for clarity anyway)
[[ "$var" == "test" ]]     # Better

# Always quote
[ "$OPTIONAL_VAR" = "required_value" ]
```

## See Also

- [var-always-quote](./var-always-quote.md) - The quoting rule
- [port-posix-test](./port-posix-test.md) - [ ] vs [[ ]]
