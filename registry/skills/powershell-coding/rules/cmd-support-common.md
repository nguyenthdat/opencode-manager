# cmd-support-common

> Support -Verbose, -Debug, -ErrorAction common parameters

## Why It Matters

Users expect `-Verbose` to reveal execution details, `-Debug` for interactive debugging, and `-ErrorAction` to control error behavior — without these your function feels broken. Enabling `[CmdletBinding()]` automatically adds these parameters, but you must also emit the right stream messages for them to be useful.

## Bad

```powershell
function Update-Database {
    param($ConnectionString, $MigrationPath)
    Write-Host "Connecting to database..."       # Always visible
    Write-Host "Applying migrations..."           # Can't suppress
    Write-Host "Done!"                            # Pollutes CI logs
    Invoke-SqlCmd -ConnectionString $ConnectionString -InputFile $MigrationPath
}
```

## Good

```powershell
function Update-Database {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ConnectionString,

        [Parameter(Mandatory)]
        [string]$MigrationPath
    )

    begin {
        Write-Verbose "Starting database update"
        Write-Debug "Connection: $ConnectionString"
        Write-Debug "Migrations: $MigrationPath"
    }

    process {
        Write-Information "Applying migration: $MigrationPath" -InformationAction Continue
        try {
            Invoke-SqlCmd -ConnectionString $ConnectionString -InputFile $MigrationPath -ErrorAction Stop
            Write-Verbose "Migration applied successfully"
        } catch {
            Write-Error "Migration failed: $_"
            throw
        }
    }

    end {
        Write-Verbose "Database update complete"
    }
}

# User controls:
Update-Database -ConnectionString $c -MigrationPath ./migrations -Verbose
Update-Database -ConnectionString $c -MigrationPath ./migrations -Debug
Update-Database -ConnectionString $c -MigrationPath ./migrations -ErrorAction Stop
```

## Use Each Stream

```powershell
# Collect Verbose/Debug output in script
$VerbosePreference = 'Continue'
$DebugPreference = 'Continue'

# Redirect streams to files
Update-Database 4>verbose.log 5>debug.log

# In CI, mute information
Update-Database -InformationAction SilentlyContinue
```

## See Also

- [cmd-advanced-function](cmd-advanced-function.md) - [CmdletBinding()]
- [cmd-no-write-host](cmd-no-write-host.md) - Use proper streams
