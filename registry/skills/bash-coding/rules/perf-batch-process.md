# perf-batch-process

> Batch operations: `git` commands, database queries

## Why It Matters

Many commands (git, docker, database clients, API tools) have high startup overhead. Running them once per item in a loop — e.g., `git add` for each file — is exponentially slower than batching. Always look for ways to pass multiple arguments in a single invocation: `git add file1 file2 file3` or piping commands to the tool's stdin.

## Bad

```bash
# One git add per file — slow
for file in "${modified[@]}"; do
    git add "$file"
done

# One API call per item
for user in "${users[@]}"; do
    curl -X POST -d "{\"user\":\"$user\"}" "$API_URL"
done

# One SQL query per row
while IFS= read -r id name; do
    psql -c "INSERT INTO users VALUES ($id, '$name')"
done < users.txt
```

## Good

```bash
# Batch git add — single invocation
git add "${modified[@]}"

# Batch API call with multiple items
printf '%s\n' "${users[@]}" | jq -R -s 'split("\n")[:-1]' | \
    curl -X POST -d @- "$API_URL/bulk"

# Batch SQL with pipe
{
    echo "BEGIN;"
    while IFS= read -r id name; do
        printf "INSERT INTO users VALUES (%s, '%s');\n" "$id" "$name"
    done < users.txt
    echo "COMMIT;"
} | psql -q "$DB"

# Or use COPY (much faster for bulk inserts)
psql -c "\copy users FROM 'users.txt' WITH (FORMAT csv)"
```

## Batch vs Loop Performance

```bash
# Bad: N git invocations, each with full startup overhead
for f in {1..100}; do git add "file_$f"; done   # ~5-10 seconds

# Good: Single git invocation
git add file_{1..100}                             # ~0.1 seconds
```

## See Also

- [perf-avoid-fork](./perf-avoid-fork.md) - Avoiding unnecessary forks
- [perf-parallel-xargs](./perf-parallel-xargs.md) - Parallel execution
