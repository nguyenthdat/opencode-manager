# io-no-binary-in-pipe

> Don't pipe binary data through text processing

## Why It Matters

Text processing tools (`grep`, `sed`, `awk`, `cut`) are designed for line-oriented text. Binary data may contain null bytes, very long "lines," or byte sequences that trigger unexpected behavior. These tools can truncate data, hang on long lines, or produce corrupted output. Use `xxd`, `od`, `base64`, or dedicated binary tools instead.

## Bad

```bash
# Binary data through grep — truncation at null byte
grep "PNG" image.png

# sed on binary — unpredictable
sed 's/foo/bar/g' < binary_file

# wc -l on binary — "lines" are meaningless
wc -l video.mp4

# head/tail on binary — may split mid-byte sequence
head -c 100 binary | text_transform
```

## Good

```bash
# Inspect binary with hex tools
xxd image.png | head -20
od -A x -t x1z binary_file
hexdump -C binary_file

# Search binary content
strings binary_file | grep "search_term"
grep -a "text" binary_file      # -a: treat binary as text
grep -abo "pattern" binary_file  # Byte offsets

# Safe binary manipulation
dd if=input.bin of=output.bin bs=1024 count=10
head -c 100 binary_file > chunk.bin  # -c: bytes, not lines

# Encode/decode for text processing
base64 < binary_file | process_text | base64 -d > output.bin

# Pipe binary between tools designed for it
tar czf - data/ | gpg --encrypt -r key > backup.tar.gz.gpg
ffmpeg -i input.mp4 -f mp3 - | lame - output.mp3
```

## See Also

- [perf-avoid-fork](./perf-avoid-fork.md) - Avoiding unnecessary forks
- [io-stderr-redirect](./io-stderr-redirect.md) - Redirecting stderr
