# test-httptest-server

> Use `httptest.NewServer`/`httptest.NewRecorder` to test HTTP code without a real network

## Why It Matters

Testing HTTP handlers or clients against a real listening server and real network calls is slow and occasionally flaky (port conflicts, firewall issues). `net/http/httptest` provides an in-process test server (`httptest.NewServer`) for testing clients, and a response recorder (`httptest.NewRecorder`) for testing handlers directly without any network at all.

## Bad

```go
func TestFetchUser(t *testing.T) {
	// Starts a real server bound to a real port, adds flakiness and startup latency
	go func() {
		http.ListenAndServe(":8080", handler())
	}()
	time.Sleep(500 * time.Millisecond) // guessing how long the server takes to start

	resp, err := http.Get("http://localhost:8080/users/1")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	// ...
}
```

## Good: Testing a Handler Directly (No Server at All)

```go
func TestUserHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/users/1", nil)
	rec := httptest.NewRecorder()

	UserHandler(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}

	var got User
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if got.ID != "1" {
		t.Errorf("ID = %q, want %q", got.ID, "1")
	}
}
```

## Good: Testing a Client Against a Real (but Local, In-Process) Server

```go
func TestClientFetchUser(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(User{ID: "1", Name: "Alice"})
	}))
	t.Cleanup(srv.Close)

	client := NewClient(srv.URL) // client points at the test server, not a real endpoint
	user, err := client.FetchUser(context.Background(), "1")
	if err != nil {
		t.Fatalf("FetchUser: %v", err)
	}
	if user.Name != "Alice" {
		t.Errorf("Name = %q, want %q", user.Name, "Alice")
	}
}
```

## Testing TLS-Specific Behavior

```go
srv := httptest.NewTLSServer(handler()) // real TLS handshake, self-signed cert
t.Cleanup(srv.Close)
client := srv.Client() // preconfigured to trust the test server's certificate
```

## See Also

- [test-cleanup-t-cleanup](test-cleanup-t-cleanup.md) - Closing the test server reliably with `t.Cleanup`
- [http-handler-signature](http-handler-signature.md) - The handler signature `httptest.NewRecorder` is designed to test
- [http-client-timeout](http-client-timeout.md) - Configuring the client under test with a bounded timeout
