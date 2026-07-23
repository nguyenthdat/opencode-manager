# io-heredoc-quote

> Quote heredoc delimiter to prevent expansion: `<<'EOF'`

## Why It Matters

Unquoted heredoc delimiters allow `$variable`, `$(command)`, and backtick expansions within the document body. This can cause unexpected behavior, especially with text containing dollar signs (configuration files, scripts, documentation). Quoting the delimiter (`<<'EOF'`) treats the content as a literal string, preventing all expansions.

## Bad

```bash
# Unquoted EOF — variables and commands expand
cat <<EOF > config.yaml
database:
  host: $DB_HOST           # Expands — intended
  password: "$ecretP@ss"   # Whoops: $ecretP@ss expands to literally "@ss"!
EOF

# Dollar signs in code break
cat <<EOF > script.sh
#!/bin/bash
price=\$100               # Escaping required — ugly
awk '{print $1}' file     # $1 disappears!
EOF
```

## Good

```bash
# Quoted EOF — nothing expands
cat <<'EOF' > config.yaml
database:
  host: ${DB_HOST}
  password: $ecretP@ss
EOF

# Mix quoted and unquoted for selective expansion
cat <<EOF > config.json
{
  "timestamp": "$(date -Iseconds)",    # Expands
  "template": $(cat <<'INNER'           # Does NOT expand
{
  "placeholder": "$VAR",
  "price": "$100.00"
}
INNER
)
}
EOF

# Use tab-indented heredoc for clean code
cat <<-'EOF'
	This text will be:
	    - Indented in the source
	    - But output without leading tabs
	EOF
```

## Heredoc Variants

```bash
# <<- strips leading tabs (not spaces!)
cat <<-EOF
	line 1
	line 2
EOF

# <<< here-string for single line
grep "pattern" <<< "$variable"

# Append with heredoc
cat <<'EOF' >> file.txt
new content
EOF
```

## See Also

- [io-here-string](./io-here-string.md) - Here-strings for single lines
- [io-file-descriptor-management](./io-file-descriptor-management.md) - Custom file descriptors
