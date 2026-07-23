# io-buffered-flush

> Use `stdbuf` or `unbuffer` when needed for line-buffered pipes

## Why It Matters

When programs detect their output is going to a pipe (not a terminal), many switch from line-buffered to fully-buffered output (e.g., 4KB blocks). This causes long delays in pipelines where you expect real-time output — `tail -f` through `grep`, progress bars, or interactive monitoring. Tools like `stdbuf` and `unbuffer` force line-buffered mode for responsive pipelines.

## Bad

```bash
# Output is buffered — grep output appears in chunks, not lines
tail -f /var/log/app.log | grep --line-buffered "ERROR"

# Slow command appears hung — output held in buffers
slow_command | while IFS= read -r line; do
    echo "Got: $line"   # Lines arrive in batches, not real-time
done

# Progress output from ffmpeg hidden until buffer fills
ffmpeg -i input.mp4 output.avi 2>&1 | grep "frame="
# No output until ffmpeg exits or buffer fills
```

## Good

```bash
# Use stdbuf to force line buffering
stdbuf -oL slow_command | while IFS= read -r line; do
    echo "Got: $line"
done

# Use unbuffer for programs that detect TTY
unbuffer slow_command | grep --line-buffered "pattern"

# Use grep's --line-buffered flag
tail -f /var/log/app.log | grep --line-buffered "ERROR"

# Force stdout to line-buffered with stdbuf
stdbuf -oL ffmpeg -i input.mp4 output.avi 2>&1 | grep "frame="

# Use script to create a pseudo-TTY (fallback)
script -q -c "slow_command" /dev/null | grep "pattern"
```

## Buffering Options

```bash
stdbuf -i0    # Unbuffered stdin
stdbuf -iL    # Line-buffered stdin
stdbuf -iNUM  # NUM-byte buffer for stdin

stdbuf -o0    # Unbuffered stdout
stdbuf -oL    # Line-buffered stdout (most common)
stdbuf -oNUM  # NUM-byte buffer for stdout

stdbuf -e0    # Unbuffered stderr
stdbuf -eL    # Line-buffered stderr
```

## See Also

- [perf-avoid-fork](./perf-avoid-fork.md) - Reducing forks
- [io-read-while-pipe](./io-read-while-pipe.md) - Read-while patterns
