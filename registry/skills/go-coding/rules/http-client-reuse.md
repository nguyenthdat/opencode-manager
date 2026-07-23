# http-client-reuse

> Reuse a single `http.Client`/`http.Transport` instead of creating one per request

## Why It Matters

`http.Client` and its underlying `http.Transport` maintain a pool of persistent, keep-alive connections. Creating a new client (or, worse, a new `Transport`) for every outgoing request throws that connection pool away each time, forcing a fresh TCP handshake (and TLS handshake, for HTTPS) on every single call - dramatically increasing latency and resource use under load.

## Bad

```go
func fetchUser(id string) (*User, error) {
	client := &http.Client{Timeout: 10 * time.Second} // new client, new connection pool, every single call
	resp, err := client.Get(apiURL + "/users/" + id)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return parseUser(resp)
}
```

## Good

```go
var client = &http.Client{ // constructed once, reused for every call for the lifetime of the process
	Timeout: 10 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 10,
		IdleConnTimeout:     90 * time.Second,
	},
}

func fetchUser(ctx context.Context, id string) (*User, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL+"/users/"+id, nil)
	if err != nil {
		return nil, err
	}
	resp, err := client.Do(req) // reuses a pooled, already-established connection whenever possible
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return parseUser(resp)
}
```

## Structuring This as a Field on Your API Client Type

```go
type APIClient struct {
	httpClient *http.Client
	baseURL    string
}

func NewAPIClient(baseURL string) *APIClient {
	return &APIClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *APIClient) FetchUser(ctx context.Context, id string) (*User, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/users/"+id, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.httpClient.Do(req)
	// ...
	return parseUser(resp)
}
```

## Always Drain and Close the Response Body

```go
resp, err := client.Do(req)
if err != nil {
	return nil, err
}
defer resp.Body.Close() // required for the connection to be returned to the pool for reuse

// If you're not going to read the whole body (e.g., after checking only the
// status code), drain it first so the underlying connection can be reused:
io.Copy(io.Discard, resp.Body)
```

Failing to fully read and close the response body prevents the connection from being reused, silently negating the benefit of the shared client/transport.

## See Also

- [http-client-timeout](http-client-timeout.md) - Configuring the timeout on this same reused client
- [mem-buffered-io](mem-buffered-io.md) - The general principle of avoiding repeated expensive setup on a hot path
- [api-constructor-new-prefix](api-constructor-new-prefix.md) - Constructing this client once via a proper constructor
