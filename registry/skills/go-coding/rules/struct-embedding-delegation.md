# struct-embedding-delegation

> Use struct embedding to delegate to an inner type while overriding specific methods

## Why It Matters

Embedding lets a type reuse another type's method set almost for free, while still allowing you to override individual methods by defining your own with the same name/signature. This "delegate everything, override a few things" shape is a common, idiomatic alternative to writing forwarding methods by hand for every single method of the embedded type.

## Bad

```go
type CountingWriter struct {
	w io.Writer
	n int64
}

// Manually forwarding a single method still requires writing it out by hand -
// fine for one method, but tedious to scale if the wrapped type has many.
func (cw *CountingWriter) Write(p []byte) (int, error) {
	n, err := cw.w.Write(p)
	cw.n += int64(n)
	return n, err
}
```

This particular example is fine as-is (one method, explicit and clear) - the anti-pattern version is reimplementing every method of a large interface just to override one:

```go
type LoggingHandler struct {
	next http.Handler
}

func (h *LoggingHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL.Path)
	h.next.ServeHTTP(w, r)
}
// Fine here since http.Handler has one method - but imagine an interface with
// ten methods where you only want to override one: forwarding all ten by hand is wasteful.
```

## Good

```go
type LoggingReadCloser struct {
	io.ReadCloser // embeds the interface: Read and Close are promoted automatically
}

// Override only Close - Read is still delegated to the embedded ReadCloser automatically.
func (l LoggingReadCloser) Close() error {
	log.Println("closing reader")
	return l.ReadCloser.Close()
}

func wrap(rc io.ReadCloser) io.ReadCloser {
	return LoggingReadCloser{ReadCloser: rc}
}
```

## The Embedded Field Must Be Initialized

```go
var l LoggingReadCloser
l.Read(buf) // panics: l.ReadCloser is nil - embedding an interface requires assigning a real value first

l = LoggingReadCloser{ReadCloser: someRealReadCloser}
l.Read(buf) // fine: delegates to someRealReadCloser.Read
```

## Rule of Thumb

Embed an interface (or a struct) specifically when you want most of its methods promoted unchanged, and you're deliberately overriding only a small subset - if you're overriding most or all of the methods anyway, plain composition with explicit forwarding is clearer than embedding.

## See Also

- [api-embedding-vs-composition](api-embedding-vs-composition.md) - The broader decision between embedding and composition
- [type-embedding-interface-satisfaction](type-embedding-interface-satisfaction.md) - Interface embedding used to compose contracts, not just delegate
- [api-small-interfaces](api-small-interfaces.md) - Small interfaces make this delegation pattern much less tedious to apply
