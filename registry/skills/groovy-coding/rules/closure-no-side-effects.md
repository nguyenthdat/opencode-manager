# closure-no-side-effects

> Keep closures side-effect-free when possible

## Why It Matters

Closures with side effects (modifying external state) are harder to test, reason about, and compose. Pure closures that transform input to output without mutations are thread-safe, cacheable, and composable. Reserve side effects for the outermost layer of your application.

## Bad

```groovy
def total = 0
def sentEmails = []

def processOrder = { order ->
    total += order.amount        // Mutates external variable
    sendEmail(order.customer)   // Side effect: sends email
    sentEmails << order.customer // Mutates external collection
    order.amount * 0.9          // Also returns a value
}

orders.each(processOrder)
```

## Good

```groovy
def calculateDiscount = { order ->
    order.amount * 0.9   // Pure: no side effects
}

def discounted = orders.collect(calculateDiscount)
def total = discounted.sum()

// Side effects isolated to their own closure
orders.each { order ->
    emailService.send(order.customer, "Order processed")
}
```

## Composition Benefits

```groovy
// Pure closures compose cleanly
def applyTax = { price -> price * 1.2 }
def applyDiscount = { price -> price * 0.9 }
def roundUp = { price -> Math.ceil(price * 100) / 100 }

def calculateFinalPrice = applyTax >> applyDiscount >> roundUp
assert calculateFinalPrice(100.0) == 108.0
```

## When Side Effects Are Necessary

```groovy
// Side effects belong at the edge, not in core logic
class OrderProcessor {
    List<Order> process(List<Order> orders) {
        orders.collect { calculateDiscount(it) }  // Pure
    }
}

// Side effects in the orchestration layer
def processor = new OrderProcessor()
def results = processor.process(orders)  // Pure computation
results.each { saveToDatabase(it) }       // Side effect isolated
```

## See Also

- [closure-compose-pipe](closure-compose-pipe.md) - Use << and >> for composition
- [col-collect-over-map](col-collect-over-map.md) - Use collect over manual loops
- [closure-each-over-for](closure-each-over-for.md) - Prefer each over for loops
