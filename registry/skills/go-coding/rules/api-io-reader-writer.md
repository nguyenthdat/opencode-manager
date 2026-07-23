# api-io-reader-writer

> Accept `io.Reader`/`io.Writer` instead of concrete types like `*os.File` or `*bytes.Buffer`

## Why It Matters

`io.Reader` and `io.Writer` are satisfied by files, network connections, in-memory buffers, compressors, and test fixtures alike. A function written against the interface works with all of them unchanged; a function written against a concrete type (`*os.File`) only works with that one type, forcing callers to write to a temp file just to call it in a test.

## Bad

```go
func WriteReport(f *os.File, report Report) error { // only works with real files
	enc := json.NewEncoder(f)
	return enc.Encode(report)
}

func LoadConfig(f *os.File) (*Config, error) { // can't test without a real file on disk
	data, err := io.ReadAll(f)
	if err != nil {
		return nil, err
	}
	var cfg Config
	return &cfg, json.Unmarshal(data, &cfg)
}
```

## Good

```go
func WriteReport(w io.Writer, report Report) error { // works with a file, buffer, response, ...
	enc := json.NewEncoder(w)
	return enc.Encode(report)
}

func LoadConfig(r io.Reader) (*Config, error) { // trivially testable with strings.NewReader
	var cfg Config
	if err := json.NewDecoder(r).Decode(&cfg); err != nil {
		return nil, fmt.Errorf("decode config: %w", err)
	}
	return &cfg, nil
}
```

## Testing Becomes Trivial

```go
func TestLoadConfig(t *testing.T) {
	r := strings.NewReader(`{"timeout": 30}`)
	cfg, err := LoadConfig(r) // no filesystem, no temp files, no real I/O
	if err != nil {
		t.Fatalf("LoadConfig: %v", err)
	}
	if cfg.Timeout != 30 {
		t.Errorf("Timeout = %d, want 30", cfg.Timeout)
	}
}
```

## When a Concrete Type Is Necessary

If the function genuinely needs file-specific operations (`Seek`, `Stat`, `Name`), accept `*os.File` or a narrower interface like `io.ReadSeeker` that captures exactly the capability needed - don't widen to `*os.File` just because that's what you have on hand at the one call site you've written so far.

## See Also

- [api-small-interfaces](api-small-interfaces.md) - Why `io.Reader`/`io.Writer` work so well as tiny, focused interfaces
- [api-accept-interfaces-return-structs](api-accept-interfaces-return-structs.md) - The general principle this is the canonical example of
- [mem-json-decoder-stream](mem-json-decoder-stream.md) - Streaming decode built directly on `io.Reader`
