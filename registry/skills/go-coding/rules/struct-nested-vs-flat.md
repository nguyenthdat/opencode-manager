# struct-nested-vs-flat

> Nest related fields into a sub-struct when they form a cohesive group

## Why It Matters

A struct with many independent top-level fields becomes harder to read and pass around as its field count grows, especially when several of those fields are always used, validated, or passed together. Grouping a cohesive subset into a named nested struct clarifies that relationship and lets you pass just that group to functions that only need it.

## Bad

```go
type Server struct {
	Addr             string
	TLSCertFile      string
	TLSKeyFile       string
	TLSMinVersion    uint16
	RetryMaxAttempts int
	RetryBackoff     time.Duration
	RetryJitter      bool
}

func startTLS(certFile, keyFile string, minVersion uint16) error { // three separately-passed values that always travel together
	// ...
	return nil
}
```

## Good

```go
type TLSConfig struct {
	CertFile   string
	KeyFile    string
	MinVersion uint16
}

type RetryConfig struct {
	MaxAttempts int
	Backoff     time.Duration
	Jitter      bool
}

type Server struct {
	Addr  string
	TLS   TLSConfig
	Retry RetryConfig
}

func startTLS(cfg TLSConfig) error { // one cohesive value instead of three separately-passed ones
	// ...
	return nil
}
```

## When Flat Is Better

```go
// A handful of genuinely independent, unrelated fields don't benefit from
// forced grouping - it just adds a level of indirection (server.Something.Field)
// without clarifying any real relationship:
type Point struct {
	X, Y float64
}
```

Nesting only pays off when the grouped fields are validated together, passed together to the same functions, or represent a genuinely separate concern (TLS settings vs. retry settings vs. the server's own address) - don't nest fields just to make a flat struct look shorter if the fields don't actually share a cohesive purpose.

## Balancing Nesting Depth

```go
// Avoid nesting so deeply that field access becomes a chain of several
// dots - two levels (Server.TLS.CertFile) is usually the practical limit
// before it's worth flattening back out or restructuring the type entirely.
cfg.Server.Network.TLS.Cert.File // three levels deep: probably over-nested
```

## See Also

- [struct-avoid-god-struct](struct-avoid-god-struct.md) - The related problem of too many ungrouped top-level fields
- [api-table-driven-config](api-table-driven-config.md) - Config structs as a natural place to apply this grouping
- [struct-init-keyed-fields](struct-init-keyed-fields.md) - Initializing a nested struct literal safely with keyed fields
