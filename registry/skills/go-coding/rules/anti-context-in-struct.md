# anti-context-in-struct

> Don't store a `context.Context` as a struct field

## Why It Matters

A `context.Context` carries a *specific call's* deadline, cancellation signal, and request-scoped values. Storing it on a long-lived struct blurs whose deadline applies to which operation, makes it easy to accidentally use a stale or already-cancelled context from a previous call, and hides the dependency from a method's signature - where Go convention (and every caller reading the code) expects to see it explicitly.

## Bad

```go
type Client struct {
	ctx  context.Context // stored once, at construction time - whose context is this, really?
	conn *grpc.ClientConn
}

func NewClient(ctx context.Context, addr string) (*Client, error) {
	conn, err := grpc.NewClient(addr)
	if err != nil {
		return nil, err
	}
	return &Client{ctx: ctx, conn: conn}, nil
}

func (c *Client) FetchUser(id string) (*User, error) {
	// Uses the context from CONSTRUCTION TIME, not from this specific call -
	// if that original context was cancelled or its deadline passed, every
	// subsequent call silently fails, with no way for THIS call to supply
	// its own deadline or cancellation.
	return doRequest(c.ctx, id)
}
```

## Good

```go
type Client struct {
	conn *grpc.ClientConn // no context stored here at all
}

func NewClient(addr string) (*Client, error) {
	conn, err := grpc.NewClient(addr)
	if err != nil {
		return nil, err
	}
	return &Client{conn: conn}, nil
}

func (c *Client) FetchUser(ctx context.Context, id string) (*User, error) { // ctx supplied per call, as it should be
	return doRequest(ctx, id)
}
```

## The Documented, Narrow Exceptions

The Go team acknowledges a small number of legitimate cases for storing a context on a struct - typically transitional code wrapping an API that predates `context.Context` support, where the struct's entire lifetime IS the operation's lifetime (e.g., some generated gRPC server-stream wrapper types do this internally). These are documented, narrow exceptions, not a general license - default to passing `ctx` per call.

## The Standard Library's Own Explicit Guidance

The `context` package's documentation states directly: "Do not store Contexts inside a struct type; instead, pass a Context explicitly to each function that needs it." This is about as unambiguous as Go API guidance gets.

## See Also

- [conc-context-first-param](conc-context-first-param.md) - Passing `ctx` correctly as a method's first parameter instead
- [name-context-var-ctx](name-context-var-ctx.md) - Naming the parameter `ctx` consistently
- [conc-context-cancel-propagate](conc-context-cancel-propagate.md) - Why the per-call context needs to flow through to every downstream call
