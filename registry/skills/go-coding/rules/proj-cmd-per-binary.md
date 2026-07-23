# proj-cmd-per-binary

> Put each binary's entry point in its own `cmd/<name>/main.go`

## Why It Matters

A project that produces more than one executable needs a place for each `main` package that doesn't collide with the others - Go requires exactly one `main` function per `main` package, so multiple binaries need multiple directories. `cmd/<name>/` is the community convention, and it also cleanly separates thin entry-point wiring from the reusable library logic those binaries share.

## Bad

```
myproject/
  main.go        # which binary does this build?
  main2.go        # a second "main" awkwardly placed alongside the first - won't even compile
                   # as-is, since a package can't have two func main() in the same directory
```

## Good

```
myproject/
  go.mod
  cmd/
    server/
      main.go     # go build ./cmd/server -> builds the "server" binary
    migrate/
      main.go     # go build ./cmd/migrate -> builds the "migrate" binary
  internal/
    app/
      app.go      # shared logic imported by both main packages
```

```go
// cmd/server/main.go
package main

func main() {
	cfg := app.LoadConfig()
	srv := app.NewServer(cfg)
	log.Fatal(srv.ListenAndServe())
}

// cmd/migrate/main.go
package main

func main() {
	cfg := app.LoadConfig()
	if err := app.RunMigrations(cfg); err != nil {
		log.Fatal(err)
	}
}
```

## Building and Installing

```sh
go build ./cmd/server               # builds a single binary
go build ./cmd/...                  # builds every binary under cmd/
go install example.com/myproject/cmd/server@latest  # installs directly from module path
```

## Rule of Thumb

Once a repository needs to produce two or more independent executables, split them into `cmd/<name>/main.go` immediately - retrofitting this structure after `main.go` has accumulated real logic at the root is more disruptive than starting with it.

## See Also

- [proj-standard-layout](proj-standard-layout.md) - The broader project layout `cmd/` is part of
- [proj-main-thin](proj-main-thin.md) - Keeping each `main.go` itself minimal
- [proj-flat-small-packages](proj-flat-small-packages.md) - When a single-binary project can skip this structure entirely
