# proj-internal-packages

> Use `internal/` packages to restrict visibility, enforced by the compiler

## Why It Matters

Any package under a directory named `internal/` can only be imported by code rooted at the parent of that `internal/` directory - this isn't just a naming convention, the Go toolchain actively enforces it at build time. It's the correct way to expose shared code across your own module's packages while guaranteeing external consumers can never depend on it (and therefore can never be broken when you change it freely).

## Bad

```
myproject/
  go.mod            # module example.com/myproject
  pkg/
    dbutil/          # "pkg/" convention exists, but nothing prevents external
      conn.go         # modules from importing example.com/myproject/pkg/dbutil,
                       # so you can never safely change its API without breaking someone
```

## Good

```
myproject/
  go.mod            # module example.com/myproject
  internal/
    dbutil/
      conn.go        # example.com/myproject/internal/dbutil
  cmd/
    server/
      main.go        # can import .../internal/dbutil: it's under the same module root
```

```go
// Attempting to import this from a DIFFERENT module fails at build time:
import "example.com/myproject/internal/dbutil"
// go: example.com/myproject/internal/dbutil is a program, not an importable package
// (or, for a different module entirely: "use of internal package ... not allowed")
```

## Nested `internal/` Directories

```
myproject/
  internal/
    auth/
      internal/
        token/        // only importable by code under myproject/internal/auth/
          token.go
```

An `internal/` directory can appear at any depth; its visibility boundary is always "anything rooted at the parent of this internal/ directory," which lets you scope internal helpers even more narrowly within a large module.

## Rule of Thumb

Default new, non-public packages to `internal/` rather than exposing them at a plain importable path "just in case" someone wants to use them - promoting something out of `internal/` later (a deliberate, additive change) is far safer than trying to walk back a public API that already has external consumers.

## See Also

- [proj-standard-layout](proj-standard-layout.md) - Where `internal/` fits in the overall project layout
- [api-minimal-exported-surface](api-minimal-exported-surface.md) - The exported-surface discipline `internal/` reinforces at the package level
- [proj-avoid-circular-deps](proj-avoid-circular-deps.md) - Structuring internal packages to avoid import cycles
