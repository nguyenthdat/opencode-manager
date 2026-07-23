# perf-string-builder

> Use StringBuilder over += for string building

## Why It Matters

PowerShell strings are immutable — each `+=` creates a new string, copying all previous content. Building a 10KB string with `+=` in a 1000-iteration loop creates 1000 intermediate strings totaling ~5MB of allocations. `StringBuilder` mutates a buffer in place, avoiding the allocation avalanche.

## Bad

```powershell
# O(n^2) string allocation
$html = '<table>'
foreach ($row in $data) {
    $html += "<tr><td>$($row.Name)</td><td>$($row.Value)</td></tr>"
}
$html += '</table>'
# 1000 rows = ~500K string copies — ~500MB allocated for 10KB output
```

## Good

```powershell
# O(n) — single buffer, mutable
$sb = [System.Text.StringBuilder]::new()
$null = $sb.AppendLine('<table>')

foreach ($row in $data) {
    $null = $sb.AppendFormat('<tr><td>{0}</td><td>{1}</td></tr>', $row.Name, $row.Value)
}

$null = $sb.AppendLine('</table>')
$html = $sb.ToString()
```

## StringBuilder Methods

```powershell
$sb = [System.Text.StringBuilder]::new()

$null = $sb.Append('static text')
$null = $sb.AppendLine('line with newline')
$null = $sb.AppendFormat('Hello {0}, you have {1} messages', $name, $count)
$null = $sb.AppendLine()
$null = $sb.Insert(0, 'prefix ')
$null = $sb.Replace('old', 'new')

$result = $sb.ToString()

# Pre-allocate capacity when size is known
$sb = [System.Text.StringBuilder]::new(10240)  # 10KB initial buffer
```

## When += Is Fine

```powershell
# OK for 2-3 concatenations — not in loops
$path = Join-Path $root $subdir
$fullPath = "$path\$filename"

# OK for small, fixed-count assembly
$message = "Hello $name. " + "Your order #$orderId " + "has shipped."

# Never OK in loops of any size
```

## See Also

- [perf-pipeline-over-loops](perf-pipeline-over-loops.md) - Pipeline performance
- [perf-regex-compiled](perf-regex-compiled.md) - Compiled regex
