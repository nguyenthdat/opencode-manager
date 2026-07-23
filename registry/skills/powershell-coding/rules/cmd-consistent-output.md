# cmd-consistent-output

> Return consistent object types from functions

## Why It Matters

When a function returns different object types depending on input or internal state, downstream cmdlets fail unpredictably. The pipeline and property-based operators (`Select-Object`, `Where-Object`, `Sort-Object`) assume a consistent object shape. Type inconsistency breaks scripting and surprises users.

## Bad

```powershell
function Get-ConfigValue {
    param([string]$Key)

    $config = Get-Content config.json | ConvertFrom-Json

    if ($config.$Key) {
        return $config.$Key  # Could be string, int, array, or object
    }
    return $null  # Returns $null — inconsistent
}

$vals = Get-ConfigValue 'database'  # Could be anything
$vals.ConnectionTimeout  # Might fail at runtime
```

## Good

```powershell
function Get-ConfigValue {
    [CmdletBinding()]
    param([string]$Key)

    $config = Get-Content config.json | ConvertFrom-Json

    if ($null -eq $config.$Key) {
        Write-Warning "Key '$Key' not found"
        return
    }

    [PSCustomObject]@{
        Key   = $Key
        Value = $config.$Key
        Type  = $config.$Key.GetType().Name
    }
}

# Always returns the same shape
Get-ConfigValue 'database' | ForEach-Object { $_.Value }
```

## Multiple, Coherent Outputs

```powershell
# OK when types are well-documented and semantically related
function Get-ItemDetail {
    param(
        [Parameter(ValueFromPipeline)]
        [string]$Path
    )

    process {
        $item = Get-Item $Path

        if ($item.PSIsContainer) {
            # Directory output type
            [PSCustomObject]@{
                Path         = $item.FullName
                Type         = 'Directory'
                ChildCount   = @(Get-ChildItem $item.FullName).Count
                LastModified = $item.LastWriteTime
            }
        } else {
            # File output type
            [PSCustomObject]@{
                Path         = $item.FullName
                Type         = 'File'
                SizeKB       = [math]::Round($item.Length / 1KB, 2)
                LastModified = $item.LastWriteTime
            }
        }
    }
}
```

## See Also

- [cmd-single-responsibility](cmd-single-responsibility.md) - Single responsibility
- [pipe-objects-over-text](pipe-objects-over-text.md) - Object streaming
