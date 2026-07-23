# param-valuefrompipeline

> Enable pipeline binding with ValueFromPipeline

## Why It Matters

`ValueFromPipeline` and `ValueFromPipelineByPropertyName` allow your function to accept input directly from the pipeline, enabling natural composition: `Get-Something | Your-Function`. Without these attributes, users must wrap calls in `ForEach-Object`, breaking the fluent pipeline experience.

## Bad

```powershell
function Send-Greeting {
    param([string]$Name)

    Write-Output "Hello, $Name!"
}

# Pipeline doesn't work — only last value bound
'Alice', 'Bob', 'Charlie' | Send-Greeting  # Outputs: Hello, Charlie!
```

## Good

```powershell
function Send-Greeting {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [string]$Name
    )

    process {
        Write-Output "Hello, $Name!"
    }
}

'Alice', 'Bob', 'Charlie' | Send-Greeting
# Hello, Alice!
# Hello, Bob!
# Hello, Charlie!
```

## ValueFromPipelineByPropertyName

```powershell
function Set-UserEmail {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipelineByPropertyName)]
        [string]$Username,

        [Parameter(Mandatory, ValueFromPipelineByPropertyName)]
        [string]$Email
    )

    process {
        Write-Verbose "Setting $Username email to $Email"
        Set-ADUser -Identity $Username -EmailAddress $Email
    }
}

# Pipeline binds from property names
[PSCustomObject]@{ Username = 'jdoe'; Email = 'jdoe@corp.com' } | Set-UserEmail
Get-ADUser -Filter * | Select-Object SamAccountName, UserPrincipalName |
    Set-UserEmail  # SamAccountName -> Username, UserPrincipalName -> Email
```

## See Also

- [cmd-pipeline-input](cmd-pipeline-input.md) - Pipeline input support
- [cmd-process-block](cmd-process-block.md) - begin/process/end
