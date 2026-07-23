# api-functional-options

> Use the functional options pattern for constructors with many optional parameters

## Why It Matters

Go has no default parameters or overloading. A constructor with several optional settings either forces callers to pass zero values for everything they don't care about, or multiplies into many `NewXWithY` variants. The functional options pattern (`With...` functions that mutate a config struct) gives a readable, backward-compatible, self-documenting call site instead.

## Bad

```go
func NewServer(addr string, timeout time.Duration, maxConns int, tls bool, logger *log.Logger) *Server {
	// every caller must supply every argument in the exact right order,
	// and adding a tenth parameter breaks every existing call site
}

s := NewServer("localhost:8080", 30*time.Second, 100, false, nil) // what do these mean at a glance?
```

## Good

```go
type Server struct {
	addr     string
	timeout  time.Duration
	maxConns int
	logger   *log.Logger
}

type Option func(*Server)

func WithTimeout(d time.Duration) Option {
	return func(s *Server) { s.timeout = d }
}

func WithMaxConns(n int) Option {
	return func(s *Server) { s.maxConns = n }
}

func WithLogger(l *log.Logger) Option {
	return func(s *Server) { s.logger = l }
}

func NewServer(addr string, opts ...Option) *Server {
	s := &Server{ // sensible defaults live in one place
		addr:     addr,
		timeout:  30 * time.Second,
		maxConns: 100,
		logger:   log.Default(),
	}
	for _, opt := range opts {
		opt(s)
	}
	return s
}

// Callers only specify what they want to override, self-documenting at the call site:
s := NewServer("localhost:8080", WithTimeout(5*time.Second), WithMaxConns(500))
```

## Options That Can Fail

```go
type Option func(*Server) error

func WithTLSCert(certFile, keyFile string) Option {
	return func(s *Server) error {
		cert, err := tls.LoadX509KeyPair(certFile, keyFile)
		if err != nil {
			return fmt.Errorf("load TLS cert: %w", err)
		}
		s.tlsCert = &cert
		return nil
	}
}

func NewServer(addr string, opts ...Option) (*Server, error) {
	s := &Server{addr: addr}
	for _, opt := range opts {
		if err := opt(s); err != nil {
			return nil, err
		}
	}
	return s, nil
}
```

## When a Plain Config Struct Is Simpler

If every field is commonly set together and there's no need for backward-compatible growth over time, a plain `Config` struct passed to the constructor is simpler than functional options - don't reach for this pattern reflexively for every constructor with more than one parameter.

## See Also

- [api-table-driven-config](api-table-driven-config.md) - The plain-struct alternative to this pattern
- [struct-constructor-validation](struct-constructor-validation.md) - Validating the fully-assembled struct before returning it
- [api-constructor-new-prefix](api-constructor-new-prefix.md) - Naming convention for the constructor itself
