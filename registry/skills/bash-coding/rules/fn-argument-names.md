# fn-argument-names

> Name function arguments at top: `local name=$1`

## Why It Matters

Shell functions receive arguments as positional parameters `$1`, `$2`, etc. Using these directly throughout a function makes code hard to read and maintain — you have to remember what `$3` represents. Assigning them to named local variables at the top of the function creates self-documenting code and makes refactoring safer.

## Bad

```bash
create_user() {
    # What do $1, $2, $3 represent?
    useradd -m -c "$3" -s /bin/bash -g "$2" "$1"
    # Is $3 the comment or the shell? Hard to tell at a glance.
}

# Direct positional use — confusing with 5+ args
configure_service() {
    if [ "$3" = "production" ]; then
        sed -i "s/host=.*/host=$1/" "$4/conf/$2.conf"
    fi
    echo "Port: $5" >> "$4/conf/$2.conf"
}
```

## Good

```bash
create_user() {
    local username="$1"
    local group="$2"
    local fullname="$3"
    useradd -m -c "$fullname" -s /bin/bash -g "$group" "$username"
}

configure_service() {
    local host="$1"
    local service="$2"
    local env="$3"
    local config_dir="$4"
    local port="$5"

    if [ "$env" = "production" ]; then
        sed -i "s/host=.*/host=${host}/" "${config_dir}/conf/${service}.conf"
    fi
    echo "Port: ${port}" >> "${config_dir}/conf/${service}.conf"
}

# With defaults
connect_db() {
    local host="${1:-localhost}"
    local port="${2:-5432}"
    local db="${3:-postgres}"
    local user="${4:-${USER}}"
    echo "Connecting to ${host}:${port}/${db} as ${user}"
}
```

## Argument Naming Convention

```bash
my_function() {
    local input_file="$1"
    local output_dir="$2"
    local dry_run="${3:-false}"    # Optional with default
    shift 3                          # Remove processed args; $@ now has remaining

    for extra in "$@"; do
        process_extra "$extra"
    done
}
```

## See Also

- [fn-argument-count](./fn-argument-count.md) - Checking argument count
- [var-local-in-functions](./var-local-in-functions.md) - Declaring local variables
