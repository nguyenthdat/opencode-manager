# perf-stringbuilder-concat

> Use `StringBuilder` for repeated string concatenation in loops instead of `+`/`+=`

## Why It Matters

`string` is immutable - every `+`/`+=` concatenation allocates an entirely new string and copies both operands into it. In a loop building up a result over many iterations, this is O(n²) total copying work. `StringBuilder` maintains a mutable internal buffer, appending in amortized O(1) per operation, then producing the final string once.

## Bad

```csharp
public string BuildReport(IEnumerable<OrderLine> lines)
{
    var report = "";
    foreach (var line in lines)
    {
        report += $"{line.Sku}: {line.Quantity} x {line.UnitPrice:C}\n"; // new string allocated every iteration
    }
    return report;
}
```

## Good

```csharp
public string BuildReport(IEnumerable<OrderLine> lines)
{
    var sb = new StringBuilder();
    foreach (var line in lines)
    {
        sb.Append(line.Sku).Append(": ").Append(line.Quantity)
          .Append(" x ").Append(line.UnitPrice.ToString("C")).Append('\n');
    }
    return sb.ToString();
}

// AppendLine and interpolated-string-aware Append overloads keep this readable
public string BuildReportReadable(IEnumerable<OrderLine> lines)
{
    var sb = new StringBuilder();
    foreach (var line in lines)
    {
        sb.AppendLine($"{line.Sku}: {line.Quantity} x {line.UnitPrice:C}");
    }
    return sb.ToString();
}
```

## Presizing for Known/Estimated Length

```csharp
var sb = new StringBuilder(capacity: lines.Count * 40); // rough estimate avoids internal buffer regrowth
```

## When `+` Concatenation Is Fine

```csharp
// A FIXED, small number of concatenations - the compiler emits a single
// string.Concat call, not a loop of allocations, so StringBuilder adds
// overhead here for no benefit.
var fullName = firstName + " " + lastName; // fine - not a loop

// String interpolation of a small, fixed number of values is equally fine
var message = $"{firstName} {lastName} placed order #{orderId}";
```

## Pooling StringBuilder Instances

```csharp
// For very high-frequency callers, pool StringBuilder instances instead of
// allocating a new one every call - see mem-object-pooling.
```

## See Also

- [perf-string-interpolation-vs-concat](perf-string-interpolation-vs-concat.md) - How interpolated strings compile
- [mem-object-pooling](mem-object-pooling.md) - Pooling StringBuilder for high-frequency use
