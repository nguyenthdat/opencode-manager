# arr-iterate-keys

> Iterate associative array keys with `"${!arr[@]}"`

## Why It Matters

Associative arrays store key-value pairs, but you often need to iterate over just the keys. `${!arr[@]}` expands to all keys of the associative array, while `${arr[@]}` gives the values. Using the wrong expansion silently produces incorrect results. The `!` prefix is the Bash idiom for "keys of."

## Bad

```bash
declare -A config=([host]=localhost [port]=5432 [db]=myapp)

# Iterating values — can't access keys
for value in "${config[@]}"; do
    echo "$value"   # localhost, 5432, myapp — but which is which?
done

# Assuming ordered keys (associative arrays are unordered!)
config=([a]=1 [b]=2 [c]=3)
for key in a b c; do   # Fragile — order not guaranteed
    echo "${config[$key]}"
done
```

## Good

```bash
declare -A config=([host]=localhost [port]=5432 [db]=myapp)

# Iterate keys, access values
for key in "${!config[@]}"; do
    echo "${key}=${config[$key]}"
done

# Sorted iteration (if order matters)
for key in $(printf '%s\n' "${!config[@]}" | sort); do
    printf '%-10s = %s\n' "$key" "${config[$key]}"
done

# Check if key exists
if [[ -n "${config[host]+set}" ]]; then
    echo "Host is configured"
fi

# Delete by key
unset 'config[db]'
```

## See Also

- [arr-declare-arrays](./arr-declare-arrays.md) - Declaring associative arrays
- [arr-length-count](./arr-length-count.md) - Array size operations
