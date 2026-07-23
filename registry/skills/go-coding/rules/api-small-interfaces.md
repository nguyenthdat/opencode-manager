# api-small-interfaces

> Keep interfaces small and focused - one or two methods

## Why It Matters

"The bigger the interface, the weaker the abstraction" - Rob Pike. A small interface is easy to implement, easy to mock, and easy to compose with other small interfaces. A large interface forces every implementer (including test doubles) to provide methods they may not need, and makes the interface far less reusable across contexts.

## Bad

```go
type Store interface {
	Get(key string) (string, error)
	Set(key, value string) error
	Delete(key string) error
	List() ([]string, error)
	Backup(w io.Writer) error
	Restore(r io.Reader) error
	Stats() Stats
	Close() error
}
// Any test double or alternate implementation must stub all eight methods,
// even a use site that only ever calls Get.
```

## Good

```go
type Getter interface {
	Get(key string) (string, error)
}

type Setter interface {
	Set(key, value string) error
}

// Compose small interfaces where a caller genuinely needs more than one capability.
type Store interface {
	Getter
	Setter
}

func Lookup(g Getter, key string) (string, error) { // depends on only what it needs
	return g.Get(key)
}
```

## The Standard Library's Own Convention

```go
type Reader interface {
	Read(p []byte) (n int, err error)
}

type Writer interface {
	Write(p []byte) (n int, err error)
}

// Composed only where genuinely needed:
type ReadWriter interface {
	Reader
	Writer
}
```

`io.Reader` and `io.Writer` are one method each - this is why they're implemented by files, network connections, buffers, compressors, and test fakes alike.

## Rule of Thumb

Define the interface at the point of use (the consumer), sized to exactly what that consumer calls - not at the point of implementation, sized to everything the concrete type happens to offer.

## See Also

- [api-accept-interfaces-return-structs](api-accept-interfaces-return-structs.md) - Where these small interfaces get used
- [name-interface-er-suffix](name-interface-er-suffix.md) - Naming convention for single-method interfaces
- [anti-premature-interface](anti-premature-interface.md) - Don't define interfaces before a second implementation exists
