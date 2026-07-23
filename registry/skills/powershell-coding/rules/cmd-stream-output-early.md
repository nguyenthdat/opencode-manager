# cmd-stream-output-early

> Output results as soon as available in process block

## Why It Matters

PowerShell's pipeline is a streaming protocol — downstream cmdlets can start processing as soon as the first item is available. Holding all results and outputting at the end defeats this benefit, consuming extra memory and delaying downstream work.

## Bad

```powershell
function Get-ProcessedData {
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline)]
        [psobject]$InputObject
    )

    begin { $results = [System.Collections.Generic.List[object]]::new() }
    process {
        $results.Add((Transform-LongRunning $InputObject))
    }
    end {
        $results  # All results at once — downstream waits
    }
}
```

## Good

```powershell
function Get-ProcessedData {
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline)]
        [psobject]$InputObject
    )

    process {
        # Output immediately — downstream starts working now
        Transform-LongRunning $InputObject
    }
}

# Downstream starts processing immediately
1..1000 | Get-ProcessedData | Export-Csv data.csv
```

## When Deferred Output Is Correct

```powershell
function Group-LogEntries {
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline)]
        [psobject]$InputObject
    )

    begin { $entries = [System.Collections.Generic.List[object]]::new() }
    process { $entries.Add($InputObject) }
    end {
        # Must collect all before grouping — correct use of deferred output
        $entries | Group-Object -Property Level | ForEach-Object {
            [PSCustomObject]@{
                Level = $_.Name
                Count = $_.Count
            }
        }
    }
}
```

## See Also

- [cmd-process-block](cmd-process-block.md) - begin/process/end blocks
- [pipe-objects-over-text](pipe-objects-over-text.md) - Object streaming
