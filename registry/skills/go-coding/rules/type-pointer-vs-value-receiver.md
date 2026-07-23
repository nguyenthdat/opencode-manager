# type-pointer-vs-value-receiver

> Pick pointer or value receivers deliberately, and stay consistent per type

## Why It Matters

A value receiver operates on a copy - mutations inside the method never affect the caller's original. A pointer receiver operates on the original and can mutate it. Mixing the two on the same type is confusing (some methods mutate, some silently don't) and can cause the type to fail to satisfy an interface the way you expect, since a value's method set doesn't include pointer-receiver methods.

## Bad

```go
type Counter struct{ n int }

func (c Counter) Inc() { c.n++ } // mutates a COPY - caller's counter never changes!
func (c *Counter) Reset() { c.n = 0 } // mixed: this one uses a pointer receiver

func main() {
	c := Counter{}
	c.Inc()
	fmt.Println(c.n) // still 0 - Inc() had no effect on the original
}
```

## Good

```go
type Counter struct{ n int }

func (c *Counter) Inc()   { c.n++ } // consistent pointer receiver: mutation is visible
func (c *Counter) Reset() { c.n = 0 }
func (c *Counter) Value() int { return c.n } // read-only methods can still use a pointer receiver
                                               // for consistency, even without mutating

func main() {
	c := &Counter{}
	c.Inc()
	fmt.Println(c.Value()) // 1
}
```

## Decision Guide

| Use a pointer receiver when... | Use a value receiver when... |
|---|---|
| The method mutates the receiver | The type is small and immutable-by-convention (e.g., a `Point`) |
| The struct is large (copy would be expensive) | Every method across the type is read-only and the type is cheap to copy |
| Any other method on the type already uses a pointer receiver (for consistency) | The type is a basic value type like `time.Duration` semantics |

## The Interface Satisfaction Trap

```go
type Shape interface {
	Area() float64
}

type Circle struct{ r float64 }

func (c *Circle) Area() float64 { return math.Pi * c.r * c.r } // pointer receiver

var s Shape = Circle{r: 2} // compile error: Circle does not implement Shape
                             // (Area method has pointer receiver, so only *Circle satisfies it)
var s2 Shape = &Circle{r: 2} // correct - use a pointer
```

## Rule of Thumb

Once any method on a type needs a pointer receiver (to mutate, or because the struct is large), make *all* its methods use pointer receivers, for consistency and to avoid the interface-satisfaction surprise above.

## See Also

- [name-receiver-consistency](name-receiver-consistency.md) - Keeping the receiver *name* consistent alongside its type
- [mem-copy-large-struct](mem-copy-large-struct.md) - The performance angle on choosing pointer vs. value
- [type-zero-value-useful](type-zero-value-useful.md) - Designing a type whose zero value works well with either receiver style
