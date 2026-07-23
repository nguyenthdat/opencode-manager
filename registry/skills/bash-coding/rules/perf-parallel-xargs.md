# perf-parallel-xargs

> Use `xargs -P` for parallel execution

## Why It Matters

Many scripts process files or data sequentially, leaving CPU cores and I/O bandwidth idle. `xargs -P` runs multiple command instances in parallel, dramatically speeding up embarrassingly parallel workloads like image processing, file conversion, API calls, or data transformation. The `-P` flag specifies the number of parallel jobs (typically CPU count).

## Bad

```bash
# Sequential processing — slow on multi-core
for file in *.jpg; do
    convert "$file" -resize 800x800 "thumb_${file}"   # One at a time
done

# Sequential downloads
for url in $(cat urls.txt); do
    curl -O "$url"   # One at a time
done
```

## Good

```bash
# Parallel with xargs -P
printf '%s\n' *.jpg | xargs -P "$(nproc)" -I {} \
    convert {} -resize 800x800 "thumb_{}"

# Parallel downloads (4 at a time)
xargs -P 4 -I {} curl -O {} < urls.txt

# With null separator for filenames with spaces
find . -name "*.jpg" -print0 | xargs -0 -P 4 -I {} \
    convert {} -resize 800x800 "thumb/{}"

# GNU Parallel (more features)
parallel convert {} -resize 800x800 thumb/{} ::: *.jpg

# Parallel with job tracking
find . -name "*.log" -print0 | \
    xargs -0 -P 4 -I {} sh -c 'gzip {} && echo "Compressed: {}"'
```

## xargs vs GNU Parallel

| Feature | xargs -P | GNU parallel |
|---------|----------|--------------|
| Availability | POSIX, always available | Separate install |
| Output ordering | Mixed | Grouped by job |
| Progress bar | No | Yes (`--bar`) |
| Remote execution | No | Yes (`--ssh`) |
| Job retries | No | Yes (`--retries`) |
| Complex pipelines | Manual | Built-in |

## See Also

- [perf-batch-process](./perf-batch-process.md) - Batching operations
- [perf-avoid-fork](./perf-avoid-fork.md) - Minimizing forks
