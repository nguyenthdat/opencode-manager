# sec-avoid-iex

> Never use Invoke-Expression (iex) with user input

## Why It Matters

`Invoke-Expression` executes arbitrary strings as PowerShell code. Combined with user input, it creates a code injection vulnerability equivalent to SQL injection. Attackers can inject arbitrary PowerShell commands that execute with the script's privileges — data exfiltration, file deletion, persistence installation.

## Bad

```powershell
# Code injection via user input
$userInput = Read-Host 'Enter search term'
Invoke-Expression "Get-ChildItem | Where-Object Name -like '*$userInput*'"

# Attacker enters: *'; Remove-Item -Recurse -Force C:\*; '
# Now the system is nuked.

# Downloaded code execution — double danger
Invoke-WebRequest https://example.com/script.ps1 | Invoke-Expression
```

## Good

```powershell
# Safe: use Where-Object directly, no string evaluation
$userInput = Read-Host 'Enter search term'
Get-ChildItem | Where-Object Name -like "*$userInput*"

# Safe: download and inspect before running
$scriptPath = Join-Path $env:TEMP 'downloaded.ps1'
Invoke-WebRequest https://trusted.example.com/script.ps1 -OutFile $scriptPath
Get-AuthenticodeSignature $scriptPath
if ((Read-Host 'Run this script? [y/N]') -eq 'y') {
    & $scriptPath
}

# If you MUST evaluate expressions, use restricted environments
$safeResult = $ExecutionContext.InvokeCommand.ExpandString($safeTemplate)
```

## Safer Alternatives

```powershell
# Instead of iex for dynamic property access:
$property = 'Name'
$obj.$property  # Safe property access, not Invoke-Expression "`$obj.$property"

# Instead of iex for dynamic method calls:
$method = 'ToString'
$obj.$method()  # Safe method invocation

# Instead of iex for script block execution:
$scriptBlock = [scriptblock]::Create('Get-Date')
& $scriptBlock   # Better than iex, but still review carefully with user input
```

## See Also

- [sec-avoid-download-pipe-iex](sec-avoid-download-pipe-iex.md) - Download-pipe-execute
- [anti-iex-abuse](anti-iex-abuse.md) - Invoke-Expression anti-pattern
