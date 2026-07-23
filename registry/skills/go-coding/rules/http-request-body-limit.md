# http-request-body-limit

> Bound request body size with `http.MaxBytesReader`

## Why It Matters

Without an explicit limit, `r.Body` will let a client stream an arbitrarily large payload into your handler, which - if fully read into memory via `io.ReadAll` or `json.Decode` - can exhaust server memory from a single malicious or buggy client request. `http.MaxBytesReader` caps how many bytes can be read from the body, returning an error once the limit is exceeded instead of allowing unbounded consumption.

## Bad

```go
func handleUpload(w http.ResponseWriter, r *http.Request) {
	data, err := io.ReadAll(r.Body) // no size limit - a client can send gigabytes and exhaust memory
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	process(data)
}
```

## Good

```go
const maxUploadSize = 10 << 20 // 10 MiB

func handleUpload(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

	data, err := io.ReadAll(r.Body)
	if err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) { // Go 1.19+: a distinct error type for this specific condition
			http.Error(w, "request body too large", http.StatusRequestEntityTooLarge)
			return
		}
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	process(data)
}
```

## Applying the Limit Globally via Middleware

```go
func withBodyLimit(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			next.ServeHTTP(w, r)
		})
	}
}

handler := chain(mux, withBodyLimit(10<<20)) // every route gets the same default limit
```

## JSON Decoding Respects the Same Limit

```go
r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
var req CreateUserRequest
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
	var maxErr *http.MaxBytesError
	if errors.As(err, &maxErr) {
		http.Error(w, "request body too large", http.StatusRequestEntityTooLarge)
		return
	}
	http.Error(w, "invalid JSON", http.StatusBadRequest)
	return
}
```

Since `json.Decoder` reads incrementally from the wrapped `r.Body`, it naturally respects the `MaxBytesReader` limit without any extra plumbing.

## Rule of Thumb

Apply a body size limit to every handler that accepts a request body, sized generously enough for legitimate use but far below what would meaningfully threaten server memory - and prefer setting it once via middleware over remembering it in every individual handler.

## See Also

- [mem-json-decoder-stream](mem-json-decoder-stream.md) - Streaming decode that composes naturally with this size limit
- [http-middleware-chaining](http-middleware-chaining.md) - Applying this limit globally via middleware, as shown above
- [lint-gosec-security](lint-gosec-security.md) - Broader defensive-programming checks this rule complements
