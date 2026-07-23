# mod-script-module-over-binary

> Prefer script modules over binary when possible

## Why It Matters

Script modules (.psm1) are human-readable, cross-platform, easier to debug, and don't require compilation. Binary modules (.dll, written in C#) are harder to inspect, platform-specific, and require recompilation for new PowerShell versions. Use binary modules only when performance demands it or when interoperating with existing .NET libraries.

## Bad

```powershell
# Binary module — opaque, platform-specific
# Install-Module MyModule — loads MyModule.dll
# Can't read, can't debug, can't contribute
# New pwsh version? Recompile.
```

## Good

```powershell
# Script module — readable, portable, debuggable
# MyModule.psm1
function Get-Data {
    [CmdletBinding()]
    param([string]$Id)
    # Logic anyone can read, verify, and fix
}

# Debug with Set-PSBreakpoint, step-through in VS Code
# Contribute with a PR — no C# knowledge needed
# Runs on Windows, Linux, macOS without rebuild
```

## When Binary Modules Are Appropriate

```powershell
# Binary module justified for:
# 1. Performance-critical number crunching
# 2. Wrapping existing .NET libraries
# 3. Low-level OS interop that P/Invoke can't handle from script

# Even then, consider a hybrid:
# - Binary cmdlet for the hot path
# - Script module wrapper for business logic

# PowerShell classes are a middle ground:
# - Compiled to IL at import time
# - Still readable source in .psm1
```

## See Also

- [mod-classes-in-psm1](mod-classes-in-psm1.md) - Classes in .psm1
- [mod-root-module-single](mod-root-module-single.md) - Single root module
