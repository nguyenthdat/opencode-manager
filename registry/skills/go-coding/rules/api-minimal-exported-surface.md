# api-minimal-exported-surface

> Keep the exported API surface minimal; default to unexported

## Why It Matters

Every exported identifier is a permanent commitment - once external code depends on it, changing or removing it is a breaking change. Exporting more than callers actually need (helper functions, internal types, implementation-detail fields) locks in maintenance burden and gives users more surface to misuse, without adding real value.

## Bad

```go
package parser

// All exported, even though only Parse is meant to be called externally.
type TokenBuffer struct {
	Tokens []Token
	Pos    int
}

func NewTokenBuffer(input string) *TokenBuffer { /* ... */ return nil }
func (b *TokenBuffer) Advance() Token          { /* ... */ return Token{} }
func (b *TokenBuffer) Peek() Token             { /* ... */ return Token{} }

func Parse(input string) (*AST, error) {
	buf := NewTokenBuffer(input)
	return parseExpr(buf)
}

func parseExpr(buf *TokenBuffer) (*AST, error) { /* ... */ return nil, nil }
```

## Good

```go
package parser

// tokenBuffer and its methods are implementation details - unexported.
type tokenBuffer struct {
	tokens []token
	pos    int
}

func newTokenBuffer(input string) *tokenBuffer { /* ... */ return nil }
func (b *tokenBuffer) advance() token          { /* ... */ return token{} }
func (b *tokenBuffer) peek() token             { /* ... */ return token{} }

// Parse is the single, deliberate public entry point.
func Parse(input string) (*AST, error) {
	buf := newTokenBuffer(input)
	return parseExpr(buf)
}

func parseExpr(buf *tokenBuffer) (*AST, error) { /* ... */ return nil, nil }
```

## Growing the Surface Deliberately

```go
// If external packages later need to customize tokenizing, export a narrow
// interface at that point - not the whole internal type, and not preemptively.
type Tokenizer interface {
	Next() (Token, error)
}
```

## Rule of Thumb

Start everything unexported. Export a name only when there's a concrete, current caller outside the package that needs it - not because it might be useful someday. `unused`/`deadcode` in `golangci-lint` and `go doc` both help audit what's actually exported versus what's actually used externally.

## See Also

- [proj-internal-packages](proj-internal-packages.md) - Using `internal/` to enforce this at the module level
- [anti-premature-interface](anti-premature-interface.md) - The same "don't expose it before it's needed" principle applied to interfaces
- [api-embedding-vs-composition](api-embedding-vs-composition.md) - Embedding can accidentally widen your exported surface
