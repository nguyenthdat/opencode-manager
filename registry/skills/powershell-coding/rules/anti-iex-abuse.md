# anti-iex-abuse

> Don't use Invoke-Expression for dynamic code execution

## Why It Matters

`Invoke-Expression` (alias `iex`) executes arbitrary strings as PowerShell code — a massive security risk with any untrusted input. It also makes code unreadable (no syntax highlighting, no tab completion), unbindable to debuggers, and bypasses all static analysis. There's almost always a safer alternative.

## Bad

```powershell
# Security disaster — user input injected into code
$command = Read-Host 'Enter command'
Invoke-Expression $command

# Unnecessary dynamic property access
$propertyName = 'Name'
Invoke-Expression "`$obj.$propertyName"

# Dynamic method call
Invoke-Expression "Get-$noun -Id $id"
```

## Good

```powershell
# Safe property access — no iex needed
$propertyName = 'Name'
$obj.$propertyName  # Dynamic, safe

# Safe method call
& "Get-$noun" -Id $id  # Call operator, no string eval

# If you must construct a command dynamically, use script blocks
$scriptBlock = [scriptblock]::Create("Get-Process -Name $processName")
& $scriptBlock  # Still review carefully with untrusted input

# Use hashtable for parameter construction
$params = @{ Name = $processName }
Get-Process @params
```

## What To Use Instead

```powershell
# Instead of: iex "`$obj.$prop"  →  $obj.$prop
# Instead of: iex "Get-$noun"    →  & "Get-$noun"
# Instead of: iex "./script.ps1"  →  & ./script.ps1
# Instead of: iex $userCode      →  Powershell -Command $userCode -NoProfile
# Instead of: iex (gc file.ps1)  →  & ./file.ps1 (review first)

# Only acceptable use of iex: trusted, static strings at module load
# e.g., registering argument completers from a list
$verbs = Get-Verb | ForEach-Object Verb
# Still: there's always a better way — Register-ArgumentCompleter
```

## See Also

- [sec-avoid-iex](sec-avoid-iex.md) - Security implications
- [sec-avoid-download-pipe-iex](sec-avoid-download-pipe-iex.md) - Download-execute pattern
