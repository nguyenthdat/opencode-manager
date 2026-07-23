# name-short-receiver

> Use short, consistent receiver names - one or two letters, an abbreviation of the type

## Why It Matters

A method receiver is referenced on nearly every line of the method body, so Go convention keeps it short (unlike Java/C#'s `this`/`self`) - typically the type's first letter or a short abbreviation. Long or generic receiver names (`this`, `self`, `instance`) add visual noise without adding information, since the type is already declared right next to it.

## Bad

```go
type Client struct{ addr string }

func (client *Client) Connect() error { /* ... */ return nil } // too verbose
func (this *Client) Close() error     { /* ... */ return nil } // not idiomatic Go
func (self *Client) Send(data []byte) error { /* ... */ return nil } // Python-ism, not Go
```

## Good

```go
type Client struct{ addr string }

func (c *Client) Connect() error            { /* ... */ return nil }
func (c *Client) Close() error              { /* ... */ return nil }
func (c *Client) Send(data []byte) error    { /* ... */ return nil }
```

## Multi-Word Types

```go
type HTTPServer struct{ addr string }

func (s *HTTPServer) Start() error { /* ... */ return nil } // "s" is fine even for multi-word types

type UserRepository struct{ db *sql.DB }

func (r *UserRepository) FindByID(id string) (*User, error) { /* ... */ return nil, nil } // "r" for repository
```

## Rules

- Pick one short name (1-2 letters) per type and use it consistently across every method of that type.
- Don't reuse a receiver name as a local variable name inside the method body - it shadows the receiver and confuses readers.
- Never use `this`/`self` - they're conventions from other languages, not Go.

## See Also

- [name-receiver-consistency](name-receiver-consistency.md) - Keeping the same receiver name across all of a type's methods
- [type-pointer-vs-value-receiver](type-pointer-vs-value-receiver.md) - Deciding whether the receiver should be a pointer or a value
- [name-mixedcaps](name-mixedcaps.md) - The broader naming convention this rule specializes
