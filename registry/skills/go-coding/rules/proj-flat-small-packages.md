# proj-flat-small-packages

> Keep small projects and packages flat; don't impose structure prematurely

## Why It Matters

Over-structuring a small project - deeply nested directories, a `cmd/`/`internal/`/`pkg/` skeleton for a 200-line tool - adds navigation overhead without adding organization value. Go's own tooling and community convention favor starting flat and introducing structure only once a real organizational need (multiple binaries, a clear internal/external API boundary) actually appears.

## Bad

```
tinytool/
  cmd/
    tinytool/
      main.go
  internal/
    app/
      app.go
    config/
      config.go
    handlers/
      handlers.go
  pkg/
    util/
      util.go
// Eight files spread across seven directories for what turns out to be
// 150 lines of code total - each jump between files costs more than it saves.
```

## Good

```
tinytool/
  go.mod
  main.go
  config.go
  handlers.go
// Everything at the root, in the single package "main" (or a single
// non-main package for a small library) - trivial to navigate.
```

## Growing Structure as the Project Actually Grows

```
tinytool/                  # started flat, as above
  go.mod
  main.go                  # still thin - see proj-main-thin
  internal/
    config/
      config.go            # split out once config.go alone exceeded a few hundred lines
                            # and had its own tests, helpers, and validation logic
    handler/
      handler.go
```

Introduce a subpackage only when a file has grown large enough, or gained enough distinct responsibility, that separating it measurably improves navigation - not preemptively, based on what a large project's structure "should" look like.

## Rule of Thumb

A single Go package can hold many files (there's no per-file size limit that matters for compilation), so splitting into subpackages is an organizational decision, not a technical requirement - make it when the split earns its own directory, README, or test file, not before.

## See Also

- [proj-standard-layout](proj-standard-layout.md) - The fuller structure to grow into once it's warranted
- [proj-package-by-feature](proj-package-by-feature.md) - How to split once splitting is warranted
- [anti-premature-interface](anti-premature-interface.md) - The same "don't add structure before it's needed" principle applied to interfaces
