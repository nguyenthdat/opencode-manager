# err-validate-before-use

> Validate inputs before processing

## Why It Matters

Catching errors deep in processing logic wastes resources and produces confusing error messages. Validate inputs at function boundaries — check paths exist, strings are non-empty, arrays have elements — before beginning any work. This is "fail fast" applied to PowerShell.

## Bad

```powershell
function Process-File {
    param($Path)

    # 100 lines of setup work...
    $content = Get-Content $Path  # Crashes here if $Path doesn't exist
    # All setup work was wasted
}
```

## Good

```powershell
function Process-File {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [string]$Path
    )

    # Validate immediately
    if (-not (Test-Path -Path $Path -PathType Leaf)) {
        $errorRecord = [System.Management.Automation.ErrorRecord]::new(
            [System.IO.FileNotFoundException]::new("File not found: $Path", $Path),
            'FileNotFound',
            [System.Management.Automation.ErrorCategory]::ResourceUnavailable,
            $Path
        )
        $PSCmdlet.ThrowTerminatingError($errorRecord)
    }

    # Only now begin processing
    Write-Verbose "Processing $Path"
    $content = Get-Content $Path
    # ...
}
```

## Validation Checklist

```powershell
function Invoke-Deployment {
    [CmdletBinding()]
    param($ArtifactPath, $TargetServer)

    # Validate all inputs upfront
    if (-not (Test-Path $ArtifactPath)) { throw "Artifact not found: $ArtifactPath" }
    if ($TargetServer -notmatch '^[a-zA-Z0-9.-]+$') { throw "Invalid server: $TargetServer" }

    # Validate environment
    if (-not (Get-Command 'kubectl' -ErrorAction SilentlyContinue)) {
        throw 'kubectl is required but not found in PATH'
    }

    # Now proceed
    kubectl apply -f $ArtifactPath
}
```

## See Also

- [param-validate-attribute](param-validate-attribute.md) - Parameter validation attributes
- [param-validate-script](param-validate-script.md) - Complex validation
