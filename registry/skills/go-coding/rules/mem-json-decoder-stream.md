# mem-json-decoder-stream

> Use `json.Decoder` to stream large payloads instead of `json.Unmarshal`

## Why It Matters

`json.Unmarshal` requires the entire input in memory as a `[]byte` before it can start decoding, and allocates the full decoded structure as well. For large payloads - big API responses, large files, NDJSON streams - this doubles memory pressure unnecessarily. `json.Decoder` reads and decodes incrementally from an `io.Reader`, without buffering the whole input up front.

## Bad

```go
func loadUsers(r io.Reader) ([]User, error) {
	data, err := io.ReadAll(r) // buffers the ENTIRE body in memory first
	if err != nil {
		return nil, err
	}
	var users []User
	if err := json.Unmarshal(data, &users); err != nil { // then allocates the whole decoded slice
		return nil, err
	}
	return users, nil
}
```

## Good

```go
func loadUsers(r io.Reader) ([]User, error) {
	var users []User
	dec := json.NewDecoder(r) // reads incrementally from the underlying reader
	if err := dec.Decode(&users); err != nil {
		return nil, err
	}
	return users, nil
}
```

## Streaming a Large NDJSON File One Record at a Time

```go
func processEach(r io.Reader, fn func(Event) error) error {
	dec := json.NewDecoder(r)
	for dec.More() { // decode one JSON value at a time instead of the whole array/stream
		var e Event
		if err := dec.Decode(&e); err != nil {
			return fmt.Errorf("decode event: %w", err)
		}
		if err := fn(e); err != nil {
			return err
		}
	}
	return nil
}
```

## Decoding an HTTP Response Body Directly

```go
func fetchUsers(ctx context.Context, url string) ([]User, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var users []User
	if err := json.NewDecoder(resp.Body).Decode(&users); err != nil { // no io.ReadAll needed
		return nil, fmt.Errorf("decode response: %w", err)
	}
	return users, nil
}
```

## When `json.Unmarshal` Is Fine

For small, already-in-memory payloads (config files, small API request bodies), `json.Unmarshal` is simpler and the memory difference is negligible. Reach for `json.Decoder` once payload size is large, streaming/NDJSON is involved, or the input is already an `io.Reader` you'd otherwise have to buffer manually.

## See Also

- [mem-buffered-io](mem-buffered-io.md) - The general buffering principle `json.Decoder` builds on
- [api-io-reader-writer](api-io-reader-writer.md) - Accepting `io.Reader` at API boundaries to enable this pattern
- [http-request-body-limit](http-request-body-limit.md) - Bounding the input size before decoding untrusted bodies
