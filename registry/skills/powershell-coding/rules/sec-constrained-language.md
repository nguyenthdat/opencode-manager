# sec-constrained-language

> Use ConstrainedLanguage mode for untrusted code

## Why It Matters

`ConstrainedLanguage` mode blocks dangerous language features (COM objects, Add-Type, arbitrary .NET calls, reflection) while allowing basic scripting. It's the safest way to run community modules, third-party scripts, or user-submitted code without full trust. Combined with `NoLanguage`, it provides defense-in-depth.

## Bad

```powershell
# Running untrusted module with full language access
Import-Module ./community-module
Invoke-CommunityFunction  # Can call [System.IO.File]::Delete(), Add-Type, etc.

# Evaluating user-submitted code without restrictions
$userScript = Get-Content user-submitted.ps1 -Raw
Invoke-Expression $userScript  # Full language access!
```

## Good

```powershell
# Run in constrained mode
$sessionState = [System.Management.Automation.Runspaces.InitialSessionState]::Create()

# Restrict to ConstrainedLanguage
$sessionState.LanguageMode = 'ConstrainedLanguage'

# Allow only specific cmdlets
$sessionState.Commands.Add(
    [System.Management.Automation.Runspaces.SessionStateCmdletEntry]::new(
        'Get-ChildItem', (Get-Command Get-ChildItem).ImplementingType, ''
    )
)

$ps = [PowerShell]::Create($sessionState)
$ps.AddScript('Get-ChildItem C:\Temp')
$ps.Invoke()
$ps.Dispose()

# Or use application control: AppLocker / WDAC
# Windows Defender Application Control can enforce ConstrainedLanguage
```

## What ConstrainedLanguage Blocks

```powershell
# Blocked in ConstrainedLanguage:
[System.IO.File]::WriteAllText('test.txt', 'data')  # .NET methods blocked
Add-Type -TypeDefinition 'public class Foo {}'        # Type definition blocked
New-Object -ComObject WScript.Shell                   # COM blocked
Invoke-Expression 'Get-Process'                       # iex blocked

# Allowed in ConstrainedLanguage:
Get-ChildItem C:\Temp
$arr = @(1, 2, 3); $arr[0]
Write-Output 'Hello'
if ($true) { 'yes' } else { 'no' }
```

## See Also

- [sec-execution-policy](sec-execution-policy.md) - Execution policy
- [sec-avoid-iex](sec-avoid-iex.md) - Avoid Invoke-Expression
