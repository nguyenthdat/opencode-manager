# api-embedding-vs-composition

> Prefer composition; use struct embedding deliberately, not as a shortcut

## Why It Matters

Go's struct embedding promotes an embedded type's fields and methods, which looks like inheritance but isn't - it doesn't give polymorphism, and it silently expands your type's public API with everything the embedded type exposes, including things you may not want to commit to as part of your contract. Plain composition (a named field, called explicitly) is more explicit and doesn't leak the embedded type's full surface.

## Bad

```go
type Buffer struct {
	bytes.Buffer // embeds and promotes Write, Read, Len, Cap, Grow, Truncate, Reset, ...
}

// Anyone holding a Buffer now sees the ENTIRE bytes.Buffer API as if it were
// Buffer's own, even methods this type never intended to expose or guarantee.
func NewBuffer() *Buffer {
	return &Buffer{}
}
```

## Good

```go
type Buffer struct {
	buf bytes.Buffer // composition: a named field, not embedded
}

func (b *Buffer) Write(p []byte) (int, error) { // explicitly delegate only what you intend to expose
	return b.buf.Write(p)
}

func (b *Buffer) String() string {
	return b.buf.String()
}
```

## When Embedding Is the Right Tool

```go
// 1. Genuinely building on a type's full behavior as a foundation, where
//    promoting the whole API is the intended design (e.g., wrapping http.Handler
//    with additional fields, or building a type that IS-A io.ReadWriteCloser).
type LoggingHandler struct {
	http.Handler // intentionally promotes ServeHTTP; this type IS a handler
	logger       *slog.Logger
}

// 2. Satisfying an interface partially while providing your own methods for the rest
//    (embedding an interface, not a struct):
type CountingReader struct {
	io.Reader
	count int64
}

func (r *CountingReader) Read(p []byte) (int, error) {
	n, err := r.Reader.Read(p)
	r.count += int64(n)
	return n, err
}
```

## Rule of Thumb

Ask: "do I want every caller of my type to also see and rely on the embedded type's entire API as part of my contract?" If yes, embed. If you only want to reuse some internal behavior while presenting your own curated API, use a named field and delegate explicitly.

## See Also

- [struct-embedding-delegation](struct-embedding-delegation.md) - The delegation pattern shown above, in more depth
- [api-minimal-exported-surface](api-minimal-exported-surface.md) - Why an unintentionally large API surface is a problem
- [api-small-interfaces](api-small-interfaces.md) - Keeping the resulting interface small regardless of embedding choice
