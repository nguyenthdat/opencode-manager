# anti-string-interpolation-exec

> Don't embed \$(...) execution in strings from user input

## Why It Matters

PowerShell expands `$(Get-Secret)` inside double-quoted strings at parse time. If user input flows into a double-quoted string containing `$(...)`, arbitrary code executes. This is a code injection vulnerability — equivalent to `Invoke-Expression` but less obvious.

## Bad

```powershell
# User input flows into double-quoted string — code injection
$userName = Read-Host 'Enter your name'
$message = "Welcome, $userName!"

# Attacker enters: $(Remove-Item -Recurse -Force C:\*);
# $message = "Welcome, $(Remove-Item -Recurse -Force C:\)!"
# Code executes during string expansion!

# Also dangerous: user input in path construction
$filePath = "C:\Users\$userInput\Documents"

# Or in SQL-like queries
$query = "SELECT * FROM Users WHERE Name = '$userInput'"
```

## Good

```powershell
# Safe: single-quoted strings — no expansion
$userName = Read-Host 'Enter your name'
$message = 'Welcome, ' + $userName + '!'  # Concatenation, no expansion

# Safe: use format strings
$message = 'Welcome, {0}!' -f $userName

# Safe: validate before using in paths
$safeName = $userName -replace '[<>:"/\\|?*]', ''
$safeName = [System.IO.Path]::GetFileName($safeName)
$filePath = Join-Path 'C:\Users' $safeName

# Safe: parameterized queries, not string interpolation
$cmd = New-Object System.Data.SqlClient.SqlCommand
$cmd.CommandText = 'SELECT * FROM Users WHERE Name = @Name'
$cmd.Parameters.AddWithValue('@Name', $userInput)
```

## String Security

```powershell
# Use single quotes for literal strings — no expansion
$path = 'C:\Program Files\MyApp\config.json'

# Use double quotes only with trusted, hardcoded variables
$path = "C:\Users\$env:USERNAME\Documents"

# Never expand user input inside double quotes
$userInput = Read-Host
# BAD:  "Processing $userInput"
# GOOD: 'Processing ' + $userInput
# GOOD: 'Processing {0}' -f $userInput
```

## See Also

- [sec-input-sanitize](sec-input-sanitize.md) - Input sanitization
- [sec-avoid-iex](sec-avoid-iex.md) - Invoke-Expression danger
