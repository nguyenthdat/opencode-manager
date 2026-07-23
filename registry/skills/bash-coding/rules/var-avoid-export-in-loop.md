# var-avoid-export-in-loop

> Don't export variables inside loops unnecessarily

## Why It Matters

`export` makes a variable available to all child processes, which is unnecessary overhead when the variable is only used within the shell. Inside a loop, repeated `export` calls add up quickly. Instead, export once before the loop if the variable is needed by child processes, or use a plain assignment if it's only used in the shell itself.

## Bad

```bash
# Exporting inside a loop — repeated unnecessary work
for file in *.txt; do
    export CURRENT_FILE="$file"
    process_file   # Subprocess inherits export
done

# Export and reassign every iteration
while IFS= read -r line; do
    export LINE="$line"
    export LINE_NUMBER="$((LINE_NUMBER + 1))"
    analyze "$line"
done < "$input"
```

## Good

```bash
# Export once, update the value in the loop
export CURRENT_FILE
for file in *.txt; do
    CURRENT_FILE="$file"
    process_file
done

# Don't export at all if only used in the shell
for file in *.txt; do
    local_file="$file"
    internal_process "$local_file"
done

# Pass values as arguments instead of environment
for file in *.txt; do
    process_file "$file" "$count"
done

# Use a subshell to contain exported variables
for file in *.txt; do
    (
        export CURRENT_FILE="$file"
        process_file
    )
done
```

## See Also

- [perf-avoid-fork](./perf-avoid-fork.md) - Performance optimization
- [name-variables-uppercase-env](./name-variables-uppercase-env.md) - Naming exported variables
