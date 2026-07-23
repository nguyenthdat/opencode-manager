# perf-string-builder

> Use `StringBuilder` over `+` in loops

## Why It Matters

String concatenation with `+` creates a new `String` object each time, allocating and copying the entire accumulated string. In loops, this becomes O(n^2) allocations. `StringBuilder` appends in place using a growable buffer with amortized O(1) appends.

## Bad

```groovy
def buildReport(List<Order> orders) {
    def report = ''
    for (order in orders) {
        report += "Order #${order.id}: ${order.total}\n"   // New allocation each iteration
    }
    report
}

def csv = ''
100_000.times { i ->
    csv += "$i,${i * 2}\n"   // 100k allocations — extremely slow
}
```

## Good

```groovy
def buildReport(List<Order> orders) {
    def sb = new StringBuilder()
    for (order in orders) {
        sb.append("Order #").append(order.id)
          .append(': ').append(order.total).append('\n')
    }
    sb.toString()
}

// Or use collect + join for one allocation
def report = orders.collect { "Order #${it.id}: ${it.total}" }.join('\n')

// Or with StringWriter
def sw = new StringWriter()
orders.each { order ->
    sw.write("Order #${order.id}: ${order.total}\n")
}
sw.toString()
```

## See Also

- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for production
- [perf-no-string-gstrings](perf-no-string-gstrings.md) - Use single-quoted strings when possible
- [closure-each-over-for](closure-each-over-for.md) - Prefer each over for loops
