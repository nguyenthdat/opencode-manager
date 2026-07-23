# http-graceful-shutdown

> Use `http.Server.Shutdown` with signal handling for a clean stop

## Why It Matters

Killing a server process abruptly (`os.Exit`, a bare `SIGKILL`, or letting the process just die) drops in-flight requests and can leave clients with connection-reset errors mid-response. `Server.Shutdown` stops accepting new connections and waits for active requests to finish (up to a bound you control), giving load balancers and clients a clean, predictable stop instead of an abrupt one.

## Bad

```go
func main() {
	srv := &http.Server{Addr: ":8080", Handler: mux}
	log.Fatal(srv.ListenAndServe())
	// No signal handling at all - a SIGTERM from an orchestrator (Kubernetes,
	// systemd) just kills the process, dropping any in-flight requests.
}
```

## Good

```go
func main() {
	srv := &http.Server{Addr: ":8080", Handler: mux}

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("listen: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop // block until a shutdown signal arrives

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
		srv.Close() // force-close any remaining connections if graceful shutdown times out
	}
	log.Println("server stopped")
}
```

## Shutting Down Multiple Components in Order

```go
func run(ctx context.Context) error {
	srv := &http.Server{Addr: ":8080", Handler: mux}
	db := openDB()

	g, ctx := errgroup.WithContext(ctx)
	g.Go(func() error {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		return srv.Shutdown(shutdownCtx)
	})
	g.Go(func() error {
		err := srv.ListenAndServe()
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	})

	if err := g.Wait(); err != nil {
		return err
	}
	return db.Close() // close dependencies only after the server itself has fully stopped
}
```

## Rules

- Always give `Shutdown` a bounded context - an unbounded shutdown can hang forever if a request never finishes.
- Ignore `http.ErrServerClosed` from `ListenAndServe` - it's the expected return value after a deliberate `Shutdown` call, not a real failure.
- Shut down dependencies (database pools, message queue connections) only after the HTTP server itself has stopped accepting/serving requests that might still need them.

## See Also

- [conc-context-cancel-propagate](conc-context-cancel-propagate.md) - The bounded-context pattern used for the shutdown deadline
- [conc-errgroup-parallel](conc-errgroup-parallel.md) - Coordinating shutdown across multiple components, as shown above
- [http-context-timeout-middleware](http-context-timeout-middleware.md) - The complementary per-request timeout concern
