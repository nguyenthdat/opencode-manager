# sec-script-signing

> Sign production scripts with Authenticode

## Why It Matters

Authenticode signing verifies script origin and integrity — users can trust that the script hasn't been tampered with since signing. Combined with `AllSigned` execution policy, unsigned scripts are blocked entirely. Signing is essential for enterprise deployment, shared repositories, and any script that runs with elevated privileges.

## Bad

```powershell
# Unsigned production deployment script — anyone can modify
# deploy.ps1 (unsigned)
param($Environment)

Write-Host "Deploying to $Environment"
Invoke-WebRequest "https://api.example.com/deploy/$Environment" -Method Post
# Attacker adds: Remove-Item -Recurse C:\data — no signature to break
```

## Good

```powershell
# Sign with code signing certificate
$cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert |
    Where-Object { $_.Subject -like '*Corp Code Signing*' }

Set-AuthenticodeSignature -FilePath .\deploy.ps1 -Certificate $cert -TimestampServer http://timestamp.digicert.com

# Validate before running
$sig = Get-AuthenticodeSignature .\deploy.ps1
if ($sig.Status -ne 'Valid') {
    throw "Script signature is invalid: $($sig.StatusMessage)"
}

# In the script, verify its own signature
if ($MyInvocation.MyCommand.ScriptBlock.File) {
    $selfSig = Get-AuthenticodeSignature $MyInvocation.MyCommand.ScriptBlock.File
    if ($selfSig.Status -ne 'Valid') {
        throw 'This script has been tampered with!'
    }
}
```

## CI/CD Signing

```powershell
# In build pipeline
$securePassword = ConvertTo-SecureString $env:PFX_PASSWORD -AsPlainText -Force
$cert = Get-PfxCertificate -FilePath .\codesign.pfx
# Or import from Azure Key Vault
$cert = Get-AzKeyVaultCertificate -VaultName $vault -Name 'CodeSigning'

Set-AuthenticodeSignature -FilePath .\dist\*.ps1 -Certificate $cert -TimestampServer http://timestamp.digicert.com
```

## See Also

- [sec-execution-policy](sec-execution-policy.md) - Execution policy
- [sec-amsi-integration](sec-amsi-integration.md) - AMSI integration
