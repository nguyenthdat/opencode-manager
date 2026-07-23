# err-finally-cleanup

> Use finally block for resource cleanup

## Why It Matters

Resources like file handles, database connections, network sockets, and COM objects must be released regardless of success or failure. The `finally` block always executes — even if an exception is thrown — making it the only reliable place for cleanup. Without it, exceptions leak resources.

## Bad

```powershell
$stream = [System.IO.File]::OpenRead('largefile.dat')
$reader = [System.IO.StreamReader]::new($stream)
$data = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
# If ReadToEnd() throws, Close() never runs — leaked handles!
```

## Good

```powershell
$stream = $null
$reader = $null
try {
    $stream = [System.IO.File]::OpenRead('largefile.dat')
    $reader = [System.IO.StreamReader]::new($stream)
    $data = $reader.ReadToEnd()
    return $data
} finally {
    if ($reader) { $reader.Dispose() }
    if ($stream) { $stream.Dispose() }
}
# Resources released even on exception
```

## Pattern with try/catch/finally

```powershell
function Invoke-DataExport {
    [CmdletBinding()]
    param($ConnectionString, $OutputPath)

    $connection = $null
    $writer = $null

    try {
        $connection = New-DbConnection -ConnectionString $ConnectionString
        $connection.Open()

        $writer = [System.IO.StreamWriter]::new($OutputPath)
        $rows = Invoke-DbQuery -Connection $connection

        foreach ($row in $rows) {
            $writer.WriteLine(($row | ConvertTo-Json -Compress))
        }
    } catch {
        Write-Error "Export failed: $_"
        throw
    } finally {
        if ($writer) { $writer.Dispose() }
        if ($connection -and $connection.State -eq 'Open') {
            $connection.Close()
            $connection.Dispose()
        }
    }
}
```

## See Also

- [err-try-catch-specific](err-try-catch-specific.md) - Specific catch blocks
- [err-no-empty-catch](err-no-empty-catch.md) - Never empty catch
