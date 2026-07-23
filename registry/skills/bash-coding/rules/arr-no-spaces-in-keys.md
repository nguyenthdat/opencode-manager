# arr-no-spaces-in-keys

> Use sensible keys for associative arrays

## Why It Matters

Associative array keys can contain spaces and special characters, but this leads to quoting nightmares and subtle bugs. Stick to simple alphanumeric keys to keep code readable and maintainable. If you need complex keys, consider using a delimiter or a different data structure.

## Bad

```bash
declare -A config

# Spaces in keys — quoting nightmare
config["database host"]="localhost"
config["database port"]=5432

echo "${config["database host"]}"   # Quoting confusion

# Empty key
config[""]=value    # What does this even mean?

# Keys with special characters
config["key with * and ?"]=value
```

## Good

```bash
declare -A config

# Simple alphanumeric keys, underscores, hyphens
config[host]="localhost"
config[port]=5432
config[db_name]="myapp"
config[max-connections]=100

# Namespaced keys with separator
config[db.host]="localhost"
config[db.port]=5432
config[redis.host]="localhost"
config[redis.port]=6379

# Numeric IDs as strings
declare -A users
users[1001]="Alice"
users[1002]="Bob"

# Iterate cleanly
for key in "${!config[@]}"; do
    echo "${key}=${config[$key]}"
done
```

## See Also

- [arr-declare-arrays](./arr-declare-arrays.md) - Declaring associative arrays
- [arr-iterate-keys](./arr-iterate-keys.md) - Iterating keys
