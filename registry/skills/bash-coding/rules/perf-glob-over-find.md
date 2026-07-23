# perf-glob-over-find

> Use glob patterns over `find` for simple directory walks

## Why It Matters

`find` spawns a new process and recursively walks directories — powerful but heavyweight. For simple patterns like "all `.txt` files in this directory" or "all `.log` files with one level of subdirectories," Bash globs (`*.txt`, `*/*.log`) are in-process and virtually instantaneous. Use globs with `nullglob`/`failglob` (not `ls`) for simple cases.

## Bad

```bash
# find for simple glob — overkill
find . -maxdepth 1 -name "*.txt" -print0 | while IFS= read -r -d '' f; do
    process "$f"
done

# find for a single directory listing
find ./logs -name "*.log" -type f | while IFS= read -r f; do
    compress "$f"
done
```

## Good

```bash
# Simple glob with nullglob
shopt -s nullglob
for f in *.txt; do
    process "$f"
done

# One level deep
shopt -s globstar nullglob
for f in logs/*.log; do
    compress "$f"
done

# Recursive glob (Bash 4.0+ with globstar)
shopt -s globstar
for f in **/*.txt; do
    process "$f"
done
```

## When find IS Better

```bash
# 1. Complex predicates (mtime, size, permissions, user)
find . -name "*.log" -mtime +30 -size +1M -delete

# 2. Executing commands on matches
find . -name "*.tmp" -exec rm {} \;

# 3. Deep recursive search (globstar has recursion depth limits)
find / -name "*.conf" 2>/dev/null

# 4. Handling huge directories (glob may exceed ARG_MAX)
find . -name "*.txt" -print0 | xargs -0 process
```

## Glob Performance

```bash
# Globs: in-process, no fork, instantaneous for normal directories
for f in *.txt; do :; done            # < 1ms

# find: external process, recursive walk
find . -maxdepth 1 -name "*.txt"      # ~5-10ms startup
```

## See Also

- [perf-avoid-fork](./perf-avoid-fork.md) - Avoiding external processes
- [anti-ls-in-for](./anti-ls-in-for.md) - Don't use ls in for loops
