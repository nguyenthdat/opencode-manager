# param-validate-script

> Use [ValidateScript()] for complex validation

## Why It Matters

When built-in validators aren't enough, `[ValidateScript()]` lets you write custom validation logic that runs before the function body. The script block receives the parameter value and must return `$true` (valid) or throw an error. This provides declarative validation with clear error messages.

## Bad

```powershell
function Import-DataFile {
    param([string]$Path)

    # Manual validation mixed with business logic
    if (-not (Test-Path $Path)) { throw "$Path does not exist" }
    if ((Get-Item $Path).Extension -ne '.csv') { throw "$Path is not a CSV" }
    if ((Get-Item $Path).Length -gt 1GB) { throw "$Path is too large" }

    Import-Csv $Path
}
```

## Good

```powershell
function Import-DataFile {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ValidateScript({
            if (-not (Test-Path $_)) {
                throw "$_ does not exist"
            }
            if ((Get-Item $_).Extension -ne '.csv') {
                throw "$_ is not a CSV file"
            }
            if ((Get-Item $_).Length -gt 1GB) {
                throw "$_ exceeds maximum file size (1 GB)"
            }
            $true
        })]
        [string]$Path
    )

    # Clean body — validation already done
    Import-Csv $Path
}
```

## Advanced ValidateScript

```powershell
function Invoke-ApiRequest {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ValidateScript({
            try {
                $parsed = [uri]::new($_)
                if ($parsed.Scheme -notin @('http', 'https')) {
                    throw "Scheme must be http or https"
                }
                if ($parsed.Host -notmatch '^[a-z0-9.-]+\.corp\.com$') {
                    throw "Only .corp.com hosts allowed"
                }
                $true
            } catch [System.UriFormatException] {
                throw "Invalid URI format: $_"
            }
        })]
        [string]$Uri
    )
}
```

## See Also

- [param-validate-attribute](param-validate-attribute.md) - Built-in validation
- [err-validate-before-use](err-validate-before-use.md) - Input validation
