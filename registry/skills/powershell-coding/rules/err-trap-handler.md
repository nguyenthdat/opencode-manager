# err-trap-handler

> Use trap statement for global error handling in scripts

## Why It Matters

The `trap` statement provides a safety net for errors in scripts where wrapping every line in `try/catch` is impractical. It catches errors in the current scope and all child scopes, making it ideal for top-level scripts that need a "last resort" error handler before exiting.

## Bad

```powershell
# No error handling — script bombs with partial state
New-Item ./temp -ItemType Directory
Copy-Item src/* ./temp/  # Fails, temp directory left behind
Remove-TempResource -Id $Id
Publish-Build $Output
# Half-executed script, dirty state
```

## Good

```powershell
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

trap {
    Write-Error "FATAL ERROR: $_"
    Write-Host "Script failed at line $($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor Red

    # Cleanup
    if (Test-Path ./temp) {
        Remove-Item ./temp -Recurse -Force
        Write-Verbose "Cleaned up temp directory"
    }

    exit 1
}

New-Item ./temp -ItemType Directory
Copy-Item src/* ./temp/
Remove-TempResource -Id $Id
Publish-Build $Output
```

## trap vs try/catch

```powershell
# trap — catches in entire scope (including child functions)
trap { Write-Error $_; continue }  # 'continue' resumes after error
Do-DangerousThing                   # Error caught by trap
Do-AnotherThing                     # Runs despite error (continue)

trap { Write-Error $_; break }     # 'break' rethrows as terminating
Do-DangerousThing                   # Error caught, then rethrown
Do-AnotherThing                     # Never runs

# try/catch — only catches in the try block
try {
    Do-DangerousThing               # Error caught
    Do-AnotherThing                 # Never runs if above threw
} catch {
    Write-Error $_
}
```

## See Also

- [err-try-catch-specific](err-try-catch-specific.md) - Specific catch blocks
- [err-erroraction-preference](err-erroraction-preference.md) - Error action preference
