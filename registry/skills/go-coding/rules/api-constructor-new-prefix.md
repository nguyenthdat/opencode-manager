# api-constructor-new-prefix

> Name constructors `New` or `NewXxx`, returning a ready-to-use value

## Why It Matters

`New`/`NewXxx` is the universal Go convention for "construct and return this type in a valid, ready state." Deviating from it (`CreateFoo`, `MakeFoo`, `Foo.Init()` returning nothing) forces every reader to look up how your particular type is supposed to be constructed instead of recognizing the pattern instantly.

## Bad

```go
type Client struct { /* ... */ }

func CreateClient(addr string) *Client { /* ... */ } // non-standard name

func (c *Client) Initialize(addr string) { // returns nothing; two-step, error-prone construction
	c.addr = addr
}

client := &Client{}
client.Initialize("localhost:8080") // easy to forget this step entirely
```

## Good

```go
type Client struct {
	addr string
	conn *grpc.ClientConn
}

// New returns the package's single primary type - so it's just "New", not "NewClient".
func New(addr string) (*Client, error) {
	conn, err := grpc.NewClient(addr)
	if err != nil {
		return nil, fmt.Errorf("dial %s: %w", addr, err)
	}
	return &Client{addr: addr, conn: conn}, nil
}

// For a package with multiple constructible types, prefix with the type name:
func NewCache(size int) *Cache { /* ... */ return &Cache{} }
func NewLogger(w io.Writer) *Logger { /* ... */ return &Logger{} }
```

## When to Return an Error From the Constructor

If construction can fail (dialing a connection, parsing a required file, validating required fields), return `(*T, error)`. If construction genuinely cannot fail, return just `*T`.

```go
func NewValidator(rules []Rule) *Validator { // can't fail: just assembles the struct
	return &Validator{rules: rules}
}

func NewValidatorFromFile(path string) (*Validator, error) { // can fail: reads and parses a file
	rules, err := loadRules(path)
	if err != nil {
		return nil, err
	}
	return &Validator{rules: rules}, nil
}
```

## See Also

- [api-functional-options](api-functional-options.md) - Extending a `New` constructor with optional configuration
- [struct-constructor-validation](struct-constructor-validation.md) - Validating invariants before returning from `New`
- [type-zero-value-useful](type-zero-value-useful.md) - When a type's zero value is already valid and `New` isn't even needed
