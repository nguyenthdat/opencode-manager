# anti-newlines-in-names

> Don't create files/vars with spaces or newlines

## Why It Matters

Filenames and variable names with spaces, newlines, or special characters require constant quoting and break naive shell parsing. While the filesystem and shell technically allow them, they create a maintenance burden and are a common source of bugs. Sanitize names to alphanumeric, dash, underscore, and dot only. If you must handle arbitrary names, use null-delimited processing.

## Bad

```bash
# Filenames with spaces — constant quoting needed
touch "my report.txt"
cp "my report.txt" "my report backup.txt"  # Quoting everywhere

# Newlines in filenames — catastrophic
touch "$(echo -e 'bad\nfile.txt')"
for f in *.txt; do echo "$f"; done   # Breaks

# Menu-driven script with spaces in options
options="Option 1 Option 2 Option 3"
for opt in $options; do   # Splits into 6 words
    echo "$opt"
done
```

## Good

```bash
# Clean filenames: alphanumeric, dash, underscore, dot
mv "my report.txt" my-report.txt
mv "January Budget 2025.xlsx" january-budget-2025.xlsx

# Sanitize function
sanitize_name() {
    local name="$1"
    name="${name//[^a-zA-Z0-9._-]/-}"
    name="${name#-}"
    name="${name%-}"
    echo "${name:-untitled}"
}

new_name="$(sanitize_name "$original")"

# If you must handle arbitrary names, use null separators
find . -print0 | while IFS= read -r -d '' path; do
    process "$path"
done
```

## See Also

- [arr-expand-properly](./arr-expand-properly.md) - Proper array expansion
- [io-read-r-preserve](./io-read-r-preserve.md) - Preserving backslashes in read
