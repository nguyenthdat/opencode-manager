# name-no-aliases-scripts

> Don't use aliases in scripts (use full cmdlet names)

## Why It Matters

Aliases (`ls`, `dir`, `curl`, `wget`, `echo`, `sleep`, `gc`) are shortcuts for interactive console use. In scripts, they reduce readability (does `curl` mean `Invoke-WebRequest` or `curl.exe`?), create portability issues (aliases differ across profiles), and break on systems where aliases are removed. Full cmdlet names are self-documenting.

## Bad

```powershell
# Aliases — confusing and non-portable
ls -Recurse | % { $_.Name }
dir $env:TEMP | ? { $_.Length -gt 1MB }
curl https://api.example.com/data | ConvertFrom-Json
sleep 5
echo "Done!"
```

## Good

```powershell
# Full cmdlet names — clear and portable
Get-ChildItem -Recurse | ForEach-Object { $_.Name }
Get-ChildItem $env:TEMP | Where-Object { $_.Length -gt 1MB }
Invoke-RestMethod -Uri 'https://api.example.com/data' | ConvertFrom-Json
Start-Sleep -Seconds 5
Write-Output "Done!"
```

## Common Alias Replacements

```powershell
# Never use in scripts:
ls, dir          → Get-ChildItem
cp, copy         → Copy-Item
mv, move         → Move-Item
rm, del, rmdir   → Remove-Item
md, mkdir        → New-Item -ItemType Directory
cat, gc, type    → Get-Content
echo, write      → Write-Output
sleep            → Start-Sleep
%, foreach       → ForEach-Object
?, where         → Where-Object
select           → Select-Object
ft, fl, fw       → Format-Table, Format-List, Format-Wide
curl, wget       → Invoke-RestMethod / Invoke-WebRequest
```

## See Also

- [anti-aliases-in-code](anti-aliases-in-code.md) - Alias anti-pattern
- [name-functions-Verb-Noun](name-functions-Verb-Noun.md) - Function naming
