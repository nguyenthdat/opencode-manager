# var-local-in-functions

> Declare function variables with `local`

## Why It Matters

Without `local`, variables assigned inside functions become global, silently overwriting values in the caller's scope. This leads to hard-to-debug side effects where calling a function unexpectedly changes the value of a variable outside it. Always declare function-local variables with `local` to contain their scope.

## Bad

```bash
count=5

process_items() {
    count=0       # Overwrites the global count!
    for item in "$@"; do
        ((count++))
    done
}

process_items a b c
echo "$count"      # Prints 3 — the global was silently changed!
```

## Good

```bash
count=5

process_items() {
    local count=0  # Function-scoped, doesn't affect global
    local item
    for item in "$@"; do
        ((count++))
    done
    echo "$count"
}

local_count="$(process_items a b c)"
echo "$count"      # Still 5 — the global is untouched
echo "$local_count" # 3
```

## Bash vs POSIX

```bash
# Bash: local is available
my_function() {
    local x=1
    local y z    # Declare multiple locals
    y="hello"
    z="world"
}

# POSIX sh: local is NOT standard
# Use a subshell or naming convention instead
my_function() {
    _my_function_x=1    # Prefix with function name
    _my_function_y=""
}
# WARNING: this is still global, just named to avoid collisions
```

## See Also

- [port-no-local-posix](./port-no-local-posix.md) - POSIX portability concern
- [fn-pure-when-possible](./fn-pure-when-possible.md) - Pure function design
