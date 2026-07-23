# anti-aliases-in-code

> Don't use aliases (ls, dir, curl) in scripts

## Why It Matters

Aliases are shortcuts for interactive console use. In scripts, they obscure intent (`curl` = `Invoke-WebRequest` or `curl.exe`?), break on systems where aliases are removed, and reduce readability for non-PowerShell developers. Full cmdlet names are self-documenting and unambiguous.

## Bad

```powershell
# Confusing aliases — what does this actually do?
ls -r | ? { $_.Length -gt 1MB } | % { $_.FullName }
dir $env:TEMP | ft Name, Length
curl https://api.example.com/data | ConvertFrom-Json
wget https://example.com/file.zip -OutFile ./file.zip
echo "Done!"; sleep 2; rm *.tmp
```

## Good

```powershell
# Full cmdlet names — clear intent
Get-ChildItem -Recurse |
    Where-Object { $_.Length -gt 1MB } |
    ForEach-Object { $_.FullName }

Get-ChildItem $env:TEMP | Format-Table Name, Length
Invoke-RestMethod -Uri 'https://api.example.com/data' | ConvertFrom-Json
Invoke-WebRequest -Uri 'https://example.com/file.zip' -OutFile ./file.zip
Write-Output "Done!"; Start-Sleep -Seconds 2; Remove-Item *.tmp
```

## Most Dangerous Aliases

```powershell
# curl and wget are especially dangerous — conflate PowerShell with native
curl → Invoke-WebRequest   # Not curl.exe!
wget → Invoke-WebRequest   # Not wget!
# If Invoke-WebRequest is removed/unavailable, curl resolves to curl.exe
# Same code, different behavior on different systems!

# Remove these from your profile to build good habits:
Remove-Item Alias:curl -Force -ErrorAction SilentlyContinue
Remove-Item Alias:wget -Force -ErrorAction SilentlyContinue
Remove-Item Alias:ls -Force -ErrorAction SilentlyContinue
```

## See Also

- [name-no-aliases-scripts](name-no-aliases-scripts.md) - No aliases in scripts
- [name-functions-Verb-Noun](name-functions-Verb-Noun.md) - Verb-Noun naming
