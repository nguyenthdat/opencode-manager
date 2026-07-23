# mem-buffered-io

> Wrap I/O in `bufio.Reader`/`bufio.Writer` for read/write-heavy loops

## Why It Matters

Every unbuffered `Read`/`Write` call on a file or network connection typically involves a system call. Reading or writing one byte, one line, or one small chunk at a time without buffering means one syscall per operation - buffering batches many small operations into fewer, larger syscalls, which is dramatically faster for anything beyond a handful of operations.

## Bad

```go
func countLines(path string) (int, error) {
	f, err := os.Open(path)
	if err != nil {
		return 0, err
	}
	defer f.Close()

	count := 0
	buf := make([]byte, 1)
	for {
		n, err := f.Read(buf) // one syscall per byte - extremely slow for large files
		if n > 0 && buf[0] == '\n' {
			count++
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return 0, err
		}
	}
	return count, nil
}
```

## Good

```go
func countLines(path string) (int, error) {
	f, err := os.Open(path)
	if err != nil {
		return 0, err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f) // buffers internally, reads large chunks per syscall
	count := 0
	for scanner.Scan() {
		count++
	}
	return count, scanner.Err()
}
```

## Buffered Writing

```go
func writeLines(path string, lines []string) (err error) {
	f, createErr := os.Create(path)
	if createErr != nil {
		return createErr
	}
	defer func() {
		if cerr := f.Close(); cerr != nil && err == nil {
			err = cerr
		}
	}()

	w := bufio.NewWriter(f)
	for _, line := range lines {
		if _, err = fmt.Fprintln(w, line); err != nil {
			return err
		}
	}
	return w.Flush() // must flush explicitly - Close() does not flush a bufio.Writer
}
```

## Rules

- Always call `Flush()` on a `bufio.Writer` before the underlying file/connection is closed; buffered data not yet flushed is silently lost otherwise.
- `bufio.NewReaderSize`/`bufio.NewWriterSize` let you tune the buffer size for known workloads (larger buffers for bulk transfer, default 4096 bytes otherwise).
- Network connections benefit from buffering just as much as files - wrap `net.Conn` the same way for protocol implementations doing many small reads/writes.

## See Also

- [mem-sync-pool-reuse](mem-sync-pool-reuse.md) - Reusing buffers across many buffered I/O operations
- [mem-json-decoder-stream](mem-json-decoder-stream.md) - Streaming decode built on the same buffering principle
- [err-no-ignore](err-no-ignore.md) - Handling the `Flush`/`Close` error correctly instead of discarding it
