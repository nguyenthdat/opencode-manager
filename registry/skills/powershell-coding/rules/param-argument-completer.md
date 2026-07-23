# param-argument-completer

> Use [ArgumentCompleter()] for tab completion

## Why It Matters

`[ArgumentCompleter()]` provides custom tab completion for parameter values, dramatically improving the interactive user experience. When users press Tab, they get contextually relevant suggestions — server names, file paths, valid values — reducing errors and speeding up command entry.

## Bad

```powershell
function Connect-Server {
    param([string]$ServerName)
    # No completion — user must know and type the exact server name
}
Connect-Server -ServerName prod-web-<TAB>  # No suggestions
```

## Good

```powershell
function Connect-Server {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ArgumentCompleter({
            param($commandName, $parameterName, $wordToComplete, $commandAst, $fakeBoundParameters)

            # Fetch server names dynamically
            Get-Content "$env:APPDATA/servers.json" |
                ConvertFrom-Json |
                ForEach-Object { $_.Name } |
                Where-Object { $_ -like "$wordToComplete*" } |
                ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
        })]
        [string]$ServerName
    )
}

Connect-Server -ServerName prod-<TAB>      # Shows: prod-web-01, prod-web-02
Connect-Server -ServerName staging-<TAB>   # Shows: staging-api, staging-db
```

## Custom Argument Completer

```powershell
# Reusable argument completer class (PS 5.0+)
class EnvironmentCompleter : IArgumentCompleter {
    [System.Collections.Generic.IEnumerable[CompletionResult]] CompleteArgument(
        [string]$commandName,
        [string]$parameterName,
        [string]$wordToComplete,
        [System.Management.Automation.Language.CommandAst]$commandAst,
        [System.Collections.IDictionary]$fakeBoundParameters
    ) {
        $envs = @('Development', 'Staging', 'Production')
        foreach ($env in $envs) {
            if ($env -like "$wordToComplete*") {
                [CompletionResult]::new($env, $env, 'ParameterValue', $env)
            }
        }
    }
}

function Deploy-Application {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ArgumentCompleter([EnvironmentCompleter])]
        [string]$Environment
    )
}
```

## See Also

- [param-supports-wildcards](param-supports-wildcards.md) - Wildcard support
- [param-validate-set](param-validate-attribute.md) - ValidateSet
