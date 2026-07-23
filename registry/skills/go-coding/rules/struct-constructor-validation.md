# struct-constructor-validation

> Validate invariants in the constructor, not scattered across every method

## Why It Matters

If a struct's fields can be set directly (via a plain literal) and every method has to re-check the same invariant defensively, that validation logic is duplicated and easy to forget in a new method. Centralizing validation in a constructor - paired with unexported fields so callers can't bypass it - guarantees every instance that exists is already valid, everywhere it's used.

## Bad

```go
type RateLimiter struct {
	MaxRequests int
	Window      time.Duration
}

func (r *RateLimiter) Allow() bool {
	if r.MaxRequests <= 0 || r.Window <= 0 { // defensive re-check, needed because fields are public
		return false // or panic, or silently misbehave - every method needs this same guard
	}
	// ...
	return true
}

r := RateLimiter{MaxRequests: -5, Window: 0} // compiles fine, is nonsense, no error until Allow() runs
```

## Good

```go
type RateLimiter struct {
	maxRequests int           // unexported: can't be set directly, only through the validated constructor
	window      time.Duration
}

func NewRateLimiter(maxRequests int, window time.Duration) (*RateLimiter, error) {
	if maxRequests <= 0 {
		return nil, fmt.Errorf("rate limiter: maxRequests must be positive, got %d", maxRequests)
	}
	if window <= 0 {
		return nil, fmt.Errorf("rate limiter: window must be positive, got %v", window)
	}
	return &RateLimiter{maxRequests: maxRequests, window: window}, nil
}

func (r *RateLimiter) Allow() bool {
	// No defensive re-check needed - every *RateLimiter that exists was
	// already validated by NewRateLimiter.
	// ...
	return true
}
```

## Validating Cross-Field Invariants

```go
type DateRange struct {
	start, end time.Time
}

func NewDateRange(start, end time.Time) (*DateRange, error) {
	if end.Before(start) {
		return nil, fmt.Errorf("date range: end %v is before start %v", end, start)
	}
	return &DateRange{start: start, end: end}, nil
}
```

A single-field range check like this can't be expressed by any individual field's type alone - it inherently requires validating the fields together, which only a constructor (or a dedicated `Validate()` method called at every construction site) can enforce reliably.

## When Validation Can't Happen at Construction

If a struct is populated by `json.Unmarshal` or similar (which bypasses any constructor entirely), add a `Validate() error` method and call it explicitly right after deserialization, at the boundary where untrusted data enters the system.

```go
var cfg Config
if err := json.Unmarshal(data, &cfg); err != nil {
	return err
}
if err := cfg.Validate(); err != nil { // validation happens right after deserialization, at the trust boundary
	return fmt.Errorf("invalid config: %w", err)
}
```

## See Also

- [struct-unexported-fields-encapsulation](struct-unexported-fields-encapsulation.md) - Making fields unexported so this validation can't be bypassed
- [api-constructor-new-prefix](api-constructor-new-prefix.md) - The `New`/`NewXxx` naming convention for this constructor
- [type-zero-value-useful](type-zero-value-useful.md) - When a useful zero value means no constructor/validation is needed at all
