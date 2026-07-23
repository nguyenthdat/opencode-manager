# port-printf-over-echo

> Use `printf` instead of `echo` for portable output

## Why It Matters

`echo` behaves inconsistently across shells and systems: `echo -e` interprets escapes on some shells but prints `-e` literally on others; `echo -n` suppresses newline on some but prints `-n` on others; backslash handling varies. `printf` is POSIX-mandated with consistent behavior everywhere, supports format strings, and never interprets switches from data.

## Bad

```bash
#!/bin/sh
# Echo behavior depends on the shell

echo -e "Line 1\nLine 2"  # dash: prints "-e Line 1\nLine 2"
echo -n "Processing..."    # dash: prints "-n Processing..."
echo "Password: \tsecret"  # \t may or may not become a tab
echo "$user_input"         # If input is "-n" or "-e", echo misbehaves
```

## Good

```bash
#!/bin/sh
# printf is predictable and POSIX

printf 'Line 1\nLine 2\n'
printf '%s' "Processing..."   # No newline
printf 'Password: \tsecret\n' # Tab always works
printf '%s\n' "$user_input"   # Safe even with "-n" or "-e"

# Format specifiers
printf 'Name: %-20s Age: %3d\n' "$name" "$age"
printf 'Price: $%.2f\n' "$price"

# Common patterns
printf '%s\n' "Header"        # Print with newline
printf '%s' "No newline"      # Print without newline
printf '%s\n' "${lines[@]}"   # Print each array element on new line
```

## echo Pitfalls

```bash
# These all behave differently on different shells:
echo -n "test"        # Some print "-n test", some don't add newline
echo -e "\t"          # Some print a tab, some print "-e \t"
echo --help           # Some print "--help", some show help
echo "\\"             # Backslash behavior varies

# The ONLY safe use of echo is printing known text without flags:
echo "Hello World"    # Safe if text contains no backslashes and no leading -
```

## See Also

- [port-avoid-bashisms](./port-avoid-bashisms.md) - POSIX compatibility
- [debug-log-function](./debug-log-function.md) - Using printf in log functions
