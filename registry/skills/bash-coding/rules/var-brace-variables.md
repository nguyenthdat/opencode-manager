# var-brace-variables

> Use `${var}` for disambiguation and clarity

## Why It Matters

Brace-enclosed variable expansions `${var}` are required when concatenating with adjacent characters, using parameter expansion operators, or referencing positional parameters beyond `$9`. Using braces consistently improves readability and prevents subtle bugs where the shell interprets the following characters as part of the variable name.

## Bad

```bash
# Ambiguous: is this $prefix_path or $prefix + "_path"?
echo "$prefix_path"

# Positional parameter confusion
echo "$10"     # Actually: ${1}0 — not the 10th argument!

# Hard to spot which parts are variable names
echo "$name_suffix_$index"
```

## Good

```bash
# Clear disambiguation
echo "${prefix}_path"

# Positional parameters beyond 9
echo "${10}"    # Correct: the 10th argument

# Easy to read
echo "${name}_suffix_${index}"

# Parameter expansion operators always use braces
echo "${var:-default}"
echo "${var#prefix}"
echo "${arr[@]}"

# Consistent braces everywhere
local name="${1}"
local count="${#items[@]}"
echo "Processing ${name} (${count} items)"
```

## See Also

- [var-default-values](./var-default-values.md) - Using parameter expansion operators
- [var-prefix-suffix-remove](./var-prefix-suffix-remove.md) - Pattern removal operators
