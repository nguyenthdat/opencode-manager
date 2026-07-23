# perf-here-string-speed

> Here-strings (`<<<`) are faster than `echo |` pipe

## Why It Matters

`echo "$var" | cmd` spawns two processes: the echo builtin runs in a subshell (due to the pipe), and `cmd` runs in another subshell. `cmd <<< "$var"` uses a here-string, which creates a temporary file descriptor — no extra processes. In tight loops or high-frequency code paths, here-strings are measurably faster.

## Bad

```bash
# Echo pipe — two subshells
echo "$data" | grep "pattern"
echo "$expression" | bc
echo "$json" | jq '.key'

# In a loop — 1000 extra fork+exec pairs
for i in {1..1000}; do
    result=$(echo "$i * 2" | bc)
done
```

## Good

```bash
# Here-string — no extra process
grep "pattern" <<< "$data"
bc <<< "$expression"
jq '.key' <<< "$json"

# Loop — significantly faster
for i in {1..1000}; do
    result=$(bc <<< "$i * 2")
done
```

## Performance Comparison

```bash
# Benchmark: 10,000 iterations

# echo | cmd: ~2.5 seconds
time for i in $(seq 1 10000); do
    echo "obase=16; $i" | bc >/dev/null
done

# <<< : ~1.2 seconds (2x faster)
time for i in $(seq 1 10000); do
    bc <<< "obase=16; $i" >/dev/null
done
```

## When to Use Which

```bash
# Here-string: single string input
grep "pattern" <<< "$variable"

# Heredoc: multi-line literal input
cat <<'EOF'
line 1
line 2
EOF

# Pipe: multi-command pipeline
generate_data | filter | transform

# Echo pipe: (almost) never — use here-string or heredoc
```

## See Also

- [io-here-string](./io-here-string.md) - Here-string syntax
- [perf-avoid-fork](./perf-avoid-fork.md) - Avoiding forks
