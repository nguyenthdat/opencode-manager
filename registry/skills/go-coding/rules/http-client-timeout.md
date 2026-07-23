# http-client-timeout

> Always set a timeout on `http.Client` - never use the zero-value default

## Why It Matters

The zero-value `http.Client{}` (and the package-level `http.DefaultClient`) has **no timeout at all** - a request to an unresponsive server will hang indefinitely, tying up a goroutine and any resources it holds for as long as the server (or network) never responds. This is one of the most common Go production incidents: a single slow or hung dependency cascades into resource exhaustion across every caller with no explicit timeout.

## Bad

```go
func fetchUser(id string) (*User, error) {
	resp, err := http.Get(apiURL + "/users/" + id) // uses http.DefaultClient: NO timeout
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	// If the server hangs, this call blocks forever - no timeout will ever fire.
	return parseUser(resp)
}
```

## Good

```go
var client = &http.Client{
	Timeout: 10 * time.Second, // covers the entire request: connect, write, read, redirects
}

func fetchUser(ctx context.Context, id string) (*User, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL+"/users/"+id, nil)
	if err != nil {
		return nil, err
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch user %s: %w", id, err)
	}
	defer resp.Body.Close()
	return parseUser(resp)
}
```

## `Client.Timeout` vs. Context Deadline

```go
client := &http.Client{Timeout: 30 * time.Second} // a blanket ceiling for every request through this client

ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second) // a tighter, per-call deadline
defer cancel()
req, _ := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
client.Do(req) // whichever deadline is tighter (the context's or the client's) wins
```

Setting both gives you a client-wide safety ceiling plus the ability to apply a stricter, call-specific deadline via context - use the context deadline for anything that should vary per call.

## Fine-Grained Timeouts via `Transport`

```go
client := &http.Client{
	Timeout: 30 * time.Second,
	Transport: &http.Transport{
		DialContext: (&net.Dialer{Timeout: 5 * time.Second}).DialContext, // connection establishment
		TLSHandshakeTimeout:   5 * time.Second,
		ResponseHeaderTimeout: 10 * time.Second, // time to receive response headers, after the request is sent
	},
}
```

## See Also

- [http-client-reuse](http-client-reuse.md) - Reusing this same configured client instead of creating a new one per call
- [conc-select-timeout](conc-select-timeout.md) - The general pattern of bounding any blocking operation
- [conc-context-cancel-propagate](conc-context-cancel-propagate.md) - Combining a client timeout with request-scoped context deadlines
