# port-sed-i-portable

> Use `sed -i.bak` for portable in-place editing

## Why It Matters

`sed -i` (in-place) has incompatible syntax between GNU sed (Linux) and BSD sed (macOS). GNU sed accepts `-i` without a backup suffix, while BSD sed requires one. `sed -i ''` works on macOS but breaks on Linux (treats `''` as the suffix). The portable approach is `sed -i.bak` (creates backup) followed by `rm file.bak`, which works everywhere.

## Bad

```bash
# GNU-only: breaks on macOS
sed -i 's/foo/bar/g' file.txt

# macOS-only: breaks on Linux
sed -i '' 's/foo/bar/g' file.txt

# Assumes one behavior unconditionally
sed -i.bak 's/foo/bar/g' file.txt   # Leaves .bak file
```

## Good

```bash
# Portable in-place sed with cleanup
sed -i.bak 's/foo/bar/g' file.txt && rm -f file.txt.bak

# Function wrapper for clean usage
sed_i() {
    # Usage: sed_i 's/foo/bar/g' file.txt
    local script="$1" file="$2"
    sed -i.bak "$script" "$file" && rm -f "${file}.bak"
}

# Using a temp file with mv (more portable)
temp="$(mktemp)"
sed 's/foo/bar/g' "$file" > "$temp" && mv "$temp" "$file"

# For cross-platform scripts, detect and adapt
if sed --version 2>/dev/null | grep -q GNU; then
    SED_INPLACE=(sed -i)
else
    SED_INPLACE=(sed -i '')
fi
"${SED_INPLACE[@]}" 's/foo/bar/g' file.txt
```

## Cross-Platform sed Patterns

```bash
# sed -i with backup then cleanup (always works)
sed -i.bak 's/pattern/replacement/g' "$file"
rm -f "${file}.bak"

# Or avoid in-place entirely with temp file (most portable)
tmp="$(mktemp)"
sed 's/pattern/replacement/g' "$file" > "$tmp"
mv "$tmp" "$file"

# Extended regex: GNU uses -r, BSD uses -E
# Portable: use basic regex or check the system
```

## See Also

- [port-avoid-bashisms](./port-avoid-bashisms.md) - Cross-platform compatibility
- [io-tempfile-safely](./io-tempfile-safely.md) - Safe temp files
