# proj-main-thin

> Keep `main.go` minimal: wire dependencies, don't implement logic

## Why It Matters

Code in `package main` can't be imported or unit-tested directly by other packages - it can only be exercised by actually running the binary. Any real logic placed in `main.go` is therefore untestable except through slow, heavyweight end-to-end tests. Keeping `main.go` limited to flag parsing, configuration loading, and dependency wiring means everything with actual behavior lives in a testable, importable package.

## Bad

```go
package main

func main() {
	addr := flag.String("addr", ":8080", "listen address")
	flag.Parse()

	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/users/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		row := db.QueryRow("SELECT * FROM users WHERE id = $1", id) // business logic, untestable here
		var u User
		if err := row.Scan(&u.ID, &u.Name); err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		json.NewEncoder(w).Encode(u)
	})

	log.Fatal(http.ListenAndServe(*addr, mux))
}
```

## Good

```go
package main

func main() {
	addr := flag.String("addr", ":8080", "listen address")
	flag.Parse()

	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}

	srv := app.NewServer(app.NewUserStore(db)) // logic lives in the importable "app" package
	log.Fatal(http.ListenAndServe(*addr, srv))
}
```

```go
// internal/app/server.go
package app

func NewServer(store UserStore) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/users/{id}", handleGetUser(store))
	return mux
}

func handleGetUser(store UserStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u, err := store.FindByID(r.Context(), r.PathValue("id"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		json.NewEncoder(w).Encode(u)
	}
}
```

Now `handleGetUser` is directly testable with `httptest`, without running the actual binary.

## Rule of Thumb

If you find yourself wanting to test something inside `main.go`, that's the signal to extract it into an importable package - `main.go`'s job is composition, not implementation.

## See Also

- [proj-cmd-per-binary](proj-cmd-per-binary.md) - Where each thin `main.go` lives for multi-binary projects
- [test-httptest-server](test-httptest-server.md) - Testing the extracted handler directly, as shown above
- [api-functional-options](api-functional-options.md) - A common pattern for configuring the constructed server/app
