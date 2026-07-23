# pipe-tee-object

> Use Tee-Object for debugging/logging pipeline

## Why It Matters

`Tee-Object` lets you inspect or log pipeline data at any point without breaking the pipeline flow. It's the PowerShell equivalent of a "tap" in functional programming. Without it, debugging a multi-stage pipeline requires breaking it apart and reassembling — error-prone and slow.

## Bad

```powershell
# Breaking pipeline for debugging
$step1 = Get-ChildItem -Recurse
Write-Host "Step1: $($step1.Count) items"
$step2 = $step1 | Where-Object { $_.Length -gt 1MB }
Write-Host "Step2: $($step2.Count) items"
$step2 | Export-Csv large-files.csv
# Need to reassemble — wastes memory storing intermediate $step1, $step2
```

## Good

```powershell
# Tee-Object for non-invasive inspection
Get-ChildItem -Recurse |
    Tee-Object -Variable step1 |                    # Store in $step1
    Where-Object { $_.Length -gt 1MB } |
    Tee-Object -Variable step2 |                    # Store in $step2
    Export-Csv large-files.csv

# Inspect after
Write-Host "Total: $($step1.Count), Large: $($step2.Count)"

# Tee-Object to file for audit trail
Get-ChildItem -Recurse |
    Tee-Object -FilePath pipeline-debug.json |
    Where-Object { $_.Length -gt 1MB } |
    Export-Csv large-files.csv
```

## Debugging Pipelines

```powershell
# Capture a sample mid-pipeline
Get-Process |
    Where-Object CPU -gt 10 |
    Tee-Object -Variable highCpu |
    Select-Object -First 5

# $highCpu now contains ALL high-CPU processes for inspection
$highCpu | Measure-Object CPU -Average

# Log to multiple places
... | Tee-Object -Variable debug -FilePath ./pipeline.log | ...
```

## See Also

- [pipe-objects-over-text](pipe-objects-over-text.md) - Object pipeline
- [cmd-stream-output-early](cmd-stream-output-early.md) - Stream output early
