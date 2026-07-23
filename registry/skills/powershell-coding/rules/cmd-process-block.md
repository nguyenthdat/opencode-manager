# cmd-process-block

> Use begin/process/end blocks for pipeline functions

## Why It Matters

Advanced functions support three named blocks: `begin` (runs once before pipeline input), `process` (runs once per pipeline object), and `end` (runs once after all pipeline input). Without `process`, your function only runs once with the last object, making it incompatible with the pipeline.

## Bad

```powershell
function ConvertTo-UpperCase {
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline)]
        [string]$Text
    )
    # No process block — only runs once, with last input
    $Text.ToUpper()
}

# Wrong behavior
'a', 'b', 'c' | ConvertTo-UpperCase  # Outputs: C (only last!)
```

## Good

```powershell
function ConvertTo-UpperCase {
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline)]
        [string]$Text
    )

    begin {
        Write-Verbose "Starting conversion"
        $count = 0
    }

    process {
        $count++
        $Text.ToUpper()
    }

    end {
        Write-Verbose "Converted $count items"
    }
}

'a', 'b', 'c' | ConvertTo-UpperCase  # Outputs: A, B, C
```

## Block Execution Order

```powershell
function Invoke-PipelineProcessor {
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline)]
        [psobject]$InputObject
    )

    begin {
        Write-Verbose 'BEGIN: Initialize (runs once)'
        # Open database, create temp files, etc.
    }

    process {
        Write-Verbose "PROCESS: Handle $InputObject (runs per object)"
        $InputObject
    }

    end {
        Write-Verbose 'END: Cleanup (runs once)'
        # Close database, remove temp files, etc.
    }
}
```

## See Also

- [cmd-pipeline-input](cmd-pipeline-input.md) - Pipeline input support
- [cmd-stream-output-early](cmd-stream-output-early.md) - Stream output early
- [cmd-advanced-function](cmd-advanced-function.md) - Advanced functions
