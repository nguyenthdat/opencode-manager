# http-json-error-response

> Return a consistent, structured JSON error envelope from every handler

## Why It Matters

An API whose error responses vary in shape from endpoint to endpoint (sometimes a bare string, sometimes `{"error": "..."}`, sometimes an HTML error page) forces every client to special-case each endpoint's failure format. A single, consistent error envelope lets clients handle every error response the same way, and lets you evolve the format (adding an error code, a trace ID) in one place.

## Bad

```go
func handleA(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "user not found", http.StatusNotFound) // plain text body
}

func handleB(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusBadRequest)
	w.Write([]byte(`{"message": "invalid input"}`)) // different key name than other endpoints
}

func handleC(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"err": "failed"}) // yet another shape, and no status code set at all
}
```

## Good

```go
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    string `json:"code,omitempty"`
	TraceID string `json:"trace_id,omitempty"`
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{
		Error:   message,
		Code:    code,
		TraceID: traceIDFromContext(context.Background()),
	})
}

func handleGetUser(w http.ResponseWriter, r *http.Request) {
	user, err := fetchUser(r.Context(), r.PathValue("id"))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			writeError(w, http.StatusNotFound, "user_not_found", "user not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal_error", "an unexpected error occurred")
		return
	}
	json.NewEncoder(w).Encode(user)
}
```

## Don't Leak Internal Details in Error Messages

```go
// Bad: exposes internal implementation detail to any client
writeError(w, http.StatusInternalServerError, "db_error", err.Error()) // "pq: connection refused" leaked to the client

// Good: log the detail server-side, return a generic message to the client
log.Printf("fetch user %s: %v", id, err)
writeError(w, http.StatusInternalServerError, "internal_error", "an unexpected error occurred")
```

## Consistent Envelope Across an Entire API

Document the envelope shape once (in your API spec/OpenAPI schema) and route every handler's error path through the same `writeError` helper (or middleware) so no endpoint can drift into a different shape as the codebase grows.

## See Also

- [http-status-codes-explicit](http-status-codes-explicit.md) - Choosing the right status code to pair with this envelope
- [err-custom-type](err-custom-type.md) - Mapping application-level error types to a `code` field in the envelope
- [err-wrap-fmt-w](err-wrap-fmt-w.md) - Preserving the real error server-side while returning a generic message to the client
