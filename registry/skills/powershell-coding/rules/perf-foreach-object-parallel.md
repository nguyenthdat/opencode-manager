# perf-foreach-object-parallel

> Use ForEach-Object -Parallel for CPU work

## Why It Matters

`ForEach-Object -Parallel` distributes CPU-bound work across multiple runspaces, leveraging all available cores. For independent, CPU-intensive operations (image resizing, JSON parsing, number crunching), parallel execution can provide near-linear speedups. Sequential processing leaves cores idle.

## Bad

```powershell
# Sequential — one core, 100 images = 100 seconds
$images = Get-ChildItem ./photos -Filter *.jpg

$images | ForEach-Object {
    $img = [System.Drawing.Image]::FromFile($_.FullName)
    $thumb = $img.GetThumbnailImage(150, 150, $null, [IntPtr]::Zero)
    $thumb.Save("./thumbs/$($_.Name)")
    $img.Dispose()
}  # ~100 seconds on single core
```

## Good

```powershell
# Parallel — 8 cores, 100 images = ~13 seconds
$images = Get-ChildItem ./photos -Filter *.jpg

$images | ForEach-Object -Parallel {
    $path = $_.FullName
    $name = $_.Name

    Add-Type -AssemblyName System.Drawing
    $img = [System.Drawing.Image]::FromFile($path)
    $thumb = $img.GetThumbnailImage(150, 150, $null, [IntPtr]::Zero)
    $thumb.Save("./thumbs/$name")
    $img.Dispose()

    [PSCustomObject]@{ File = $name; Status = 'Processed' }
} -ThrottleLimit $env:NUMBER_OF_PROCESSORS
```

## Variables in Parallel Blocks

```powershell
# Use $using: to access variables from the calling scope
$outputDir = './results'
$apiKey = Get-Secret 'ApiKey'

1..100 | ForEach-Object -Parallel {
    $result = Invoke-RestMethod -Uri "https://api.corp.com/item/$_" `
        -Headers @{ Authorization = "Bearer $($using:apiKey)" }

    $result | Export-Csv (Join-Path $using:outputDir "item-$_.csv")
} -ThrottleLimit 10
```

## See Also

- [pipe-parallel-foreach](pipe-parallel-foreach.md) - Parallel ForEach-Object
- [perf-pipeline-over-loops](perf-pipeline-over-loops.md) - Pipeline performance
