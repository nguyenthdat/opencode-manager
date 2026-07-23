# type-embedding-interface-satisfaction

> Use interface embedding deliberately to build larger contracts from small ones

## Why It Matters

Just as structs can embed other structs, interfaces can embed other interfaces to compose a larger contract from smaller, independently-useful ones. Used well, this lets you require exactly the combination of capabilities a function needs without redeclaring each method; used carelessly, it can produce large composed interfaces that reintroduce the "big interface" problem this pattern is meant to avoid.

## Bad

```go
// Redeclaring each method instead of embedding - drifts out of sync with
// Reader/Writer/Closer if any of their signatures ever change.
type ReadWriteCloser interface {
	Read(p []byte) (n int, err error)
	Write(p []byte) (n int, err error)
	Close() error
}
```

## Good

```go
type ReadWriteCloser interface {
	io.Reader
	io.Writer
	io.Closer
}

// A function that genuinely needs all three capabilities can depend on the
// composed interface, while most functions should still depend on just the
// one or two small interfaces they actually use:
func copyAndClose(dst io.Writer, src ReadWriteCloser) error {
	defer src.Close()
	_, err := io.Copy(dst, src)
	return err
}
```

## Partial Interface Satisfaction via Struct Embedding

```go
// Embedding an interface (not a struct) inside a struct lets you implement
// only the methods you want to override, delegating the rest to the embedded
// value - useful for decorators/wrappers around an existing implementation.
type LoggingReader struct {
	io.Reader // delegates Read to whatever concrete Reader is assigned here
}

func (r LoggingReader) Read(p []byte) (int, error) {
	n, err := r.Reader.Read(p)
	log.Printf("read %d bytes", n)
	return n, err
}
```

If `r.Reader` is left as its zero value (`nil`), calling `Read` panics - this pattern requires the embedded interface field to always be assigned a real implementation before use.

## Rule of Thumb

Compose interfaces from smaller ones when a genuine use case needs the combination; don't reach for a large composed interface as the default parameter type when a function only calls one or two of its methods (see `api-small-interfaces`).

## See Also

- [api-small-interfaces](api-small-interfaces.md) - Keeping the individual pieces small before composing them
- [struct-embedding-delegation](struct-embedding-delegation.md) - The struct-embedding side of this same delegation idea
- [api-embedding-vs-composition](api-embedding-vs-composition.md) - When embedding is the right tool versus plain composition
