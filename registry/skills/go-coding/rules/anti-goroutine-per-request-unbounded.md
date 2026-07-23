# anti-goroutine-per-request-unbounded

> Don't spawn one goroutine per incoming item with no upper bound

## Why It Matters

Spawning a goroutine for every request, message, or item processed scales concurrency linearly with input volume - fine under normal load, dangerous the moment input volume spikes (a traffic surge, a burst from a queue, an attacker deliberately flooding an endpoint). Each goroutine costs stack memory and scheduler overhead, and downstream dependencies (a database connection pool, another service) usually have their own concurrency limits that unbounded fan-out will blow straight past.

## Bad

```go
func handleBatch(w http.ResponseWriter, r *http.Request) {
	var items []Item
	json.NewDecoder(r.Body).Decode(&items) // attacker-controlled size, unbounded

	for _, item := range items {
		go process(item) // one goroutine per item, however many the client sent - no cap at all
	}
	w.WriteHeader(http.StatusAccepted)
}
```

A client sending a batch of a million items spawns a million goroutines instantly, each likely also opening a database connection or making an outbound HTTP call - overwhelming both this process and whatever it's calling.

## Good

```go
func handleBatch(w http.ResponseWriter, r *http.Request) {
	var items []Item
	if err := json.NewDecoder(r.Body).Decode(&items); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if len(items) > maxBatchSize {
		http.Error(w, "batch too large", http.StatusRequestEntityTooLarge)
		return
	}

	const workerCount = 16
	jobs := make(chan Item)
	g, ctx := errgroup.WithContext(r.Context())
	for w := 0; w < workerCount; w++ {
		g.Go(func() error {
			for item := range jobs {
				if err := process(ctx, item); err != nil {
					return err
				}
			}
			return nil
		})
	}
	for _, item := range items {
		jobs <- item
	}
	close(jobs)

	if err := g.Wait(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusAccepted)
}
```

## Also Bound the Number of Concurrent Requests, Not Just Items Within One

```go
sem := make(chan struct{}, 100) // caps concurrent in-flight requests handled this way, process-wide

func withConcurrencyLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sem <- struct{}{}
		defer func() { <-sem }()
		next.ServeHTTP(w, r)
	})
}
```

## See Also

- [conc-worker-pool-bounded](conc-worker-pool-bounded.md) - The bounded-pool pattern used to fix this anti-pattern
- [http-request-body-limit](http-request-body-limit.md) - Bounding the request itself before it can drive unbounded work
- [conc-channel-buffered-backpressure](conc-channel-buffered-backpressure.md) - Sizing the job queue that feeds the worker pool
