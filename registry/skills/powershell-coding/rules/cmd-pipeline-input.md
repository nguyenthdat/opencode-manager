# cmd-pipeline-input

> Support pipeline input via ValueFromPipeline/ValueFromPipelineByPropertyName

## Why It Matters

PowerShell's core strength is the pipeline: `Get-Process | Stop-Process`. Without pipeline input support, users must use `ForEach-Object { MyCmdlet $_ }` as workaround. Supporting pipeline input makes your functions compose naturally with the ecosystem.

## Bad

```powershell
function Stop-MyProcess {
    [CmdletBinding()]
    param([string]$Name)

    $proc = Get-Process $Name
    $proc.Kill()
}

# Pipeline broken — error
'chrome', 'notepad' | Stop-MyProcess  # Fails: $Name gets nothing
```

## Good

```powershell
function Stop-MyProcess {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipeline, ValueFromPipelineByPropertyName)]
        [Alias('ProcessName')]
        [string]$Name
    )

    process {
        $proc = Get-Process $Name -ErrorAction SilentlyContinue
        if ($proc) {
            $proc.Kill()
            Write-Verbose "Stopped $Name"
        }
    }
}

# Pipeline works:
'chrome', 'notepad' | Stop-MyProcess
Get-Process | Where-Object CPU -gt 100 | Stop-MyProcess  # ValueFromPipelineByPropertyName
```

## When to Use Which Binding

```powershell
# ValueFromPipeline — bind at whole object
function ConvertTo-Jsonl {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [psobject]$InputObject
    )
    process { $InputObject | ConvertTo-Json -Compress }
}

# ValueFromPipelineByPropertyName — bind from property name match
function Get-UserDetail {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipelineByPropertyName)]
        [Alias('Identity', 'User')]
        [string]$Username
    )
    process { Get-ADUser $Username -Properties * }
}
```

## See Also

- [cmd-process-block](cmd-process-block.md) - begin/process/end
- [param-valuefrompipeline](param-valuefrompipeline.md) - Pipeline parameter binding
