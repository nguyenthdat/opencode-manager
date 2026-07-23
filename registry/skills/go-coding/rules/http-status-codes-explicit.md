# http-status-codes-explicit

> Set HTTP status codes explicitly and correctly, using the named constants

## Why It Matters

`http.ResponseWriter` defaults to `200 OK` if you never call `WriteHeader` before the first `Write` - which means a handler that hits an error path but forgets to call `WriteHeader` silently reports success to the client even though the response body describes a failure. Using the named `http.Status*` constants (instead of bare integers) also makes the intended meaning obvious at the call site and self-documents in code review.

## Bad

```go
func handleCreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Write([]byte("bad request")) // no WriteHeader call - client receives 200 OK by default!
		return
	}

	user, err := createUser(req)
	if err != nil {
		w.WriteHeader(500) // magic number instead of a named constant
		return
	}
	w.WriteHeader(200) // also a magic number, and called AFTER encoding started below is a separate bug
	json.NewEncoder(w).Encode(user)
}
```

## Good

```go
func handleCreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest) // sets status + writes the body correctly
		return
	}

	user, err := createUser(req)
	if err != nil {
		var validationErr *ValidationError
		if errors.As(err, &validationErr) {
			http.Error(w, err.Error(), http.StatusUnprocessableEntity)
			return
		}
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated) // 201, since this created a new resource
	json.NewEncoder(w).Encode(user)
}
```

## `WriteHeader` Must Be Called Before Any `Write`

```go
w.Header().Set("Content-Type", "application/json") // headers must be set BEFORE WriteHeader
w.WriteHeader(http.StatusCreated)                    // this call sends headers and locks them in
json.NewEncoder(w).Encode(user)                       // writing the body after WriteHeader is correct
// Calling w.Header().Set(...) AFTER WriteHeader has no effect - it's too late.
```

## Common Status Codes and Their Meaning

```go
http.StatusOK                  // 200: success, has a response body
http.StatusCreated             // 201: success, a new resource was created
http.StatusNoContent           // 204: success, no response body
http.StatusBadRequest          // 400: malformed request (client's fault, syntax-level)
http.StatusUnauthorized        // 401: missing/invalid authentication
http.StatusForbidden           // 403: authenticated but not permitted
http.StatusNotFound            // 404: resource doesn't exist
http.StatusUnprocessableEntity // 422: well-formed request, semantically invalid (validation failure)
http.StatusInternalServerError // 500: unexpected server-side failure
http.StatusGatewayTimeout      // 504: an upstream dependency timed out
```

## See Also

- [http-json-error-response](http-json-error-response.md) - Structuring the error body that accompanies these status codes
- [http-handler-signature](http-handler-signature.md) - The handler shape these status codes are set within
- [err-custom-type](err-custom-type.md) - Mapping a custom error type to the right status code, as shown above
