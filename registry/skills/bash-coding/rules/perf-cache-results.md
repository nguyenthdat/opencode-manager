# perf-cache-results

> Cache expensive command results in variables

## Why It Matters

Repeatedly running the same expensive command (e.g., `git rev-parse`, `date`, `hostname`) wastes CPU and I/O. Cache the result in a variable and reuse it. This is especially important in loops and functions called multiple times. A single cached invocation is often 100-1000x faster than repeated execution.

## Bad

```bash
# Repeated git invocations — slow
for file in "${files[@]}"; do
    git log -1 --format="%h" "$file"     # Git invoked N times
    echo "Last commit: $(git rev-parse HEAD)"   # Same value every iteration!
done

# Repeated date calls
for i in {1..100}; do
    echo "[$(date -Iseconds)] Processing item $i"   # date invoked 100 times
done
```

## Good

```bash
# Cache once, reuse
head_commit="$(git rev-parse HEAD)"
for file in "${files[@]}"; do
    log_entry="$(git log -1 --format="%h" "$file")"
    echo "Last commit of ${file}: ${log_entry} (HEAD: ${head_commit})"
done

# Cache timestamp
timestamp="$(date -Iseconds)"
for i in {1..100}; do
    echo "[${timestamp}] Processing item $i"
done

# Cache with function
get_hostname() {
    if [[ -z "${_cached_hostname:-}" ]]; then
        _cached_hostname="$(hostname)"
    fi
    echo "$_cached_hostname"
}
```

## Caching Patterns

```bash
# 1. Simple variable cache
git_root="$(git rev-parse --show-toplevel)"
# Use $git_root throughout, not repeated $(git rev-parse ...)

# 2. Lazy-loading cache (compute on first access)
get_config_value() {
    local key="$1"
    if [[ -z "${_config_loaded:-}" ]]; then
        while IFS='=' read -r k v; do
            declare -g "_config_${k}=${v}"
        done < "$CONFIG_FILE"
        _config_loaded=1
    fi
    local -n ref="_config_${key}"
    echo "${ref:-}"
}

# 3. Associative array cache
declare -A _cache
cached_exec() {
    local key="$1"
    shift
    if [[ -z "${_cache[$key]:-}" ]]; then
        _cache[$key]="$("$@")"
    fi
    echo "${_cache[$key]}"
}
```

## See Also

- [perf-avoid-fork](./perf-avoid-fork.md) - Avoiding external processes
- [arr-declare-arrays](./arr-declare-arrays.md) - Associative arrays for caching
