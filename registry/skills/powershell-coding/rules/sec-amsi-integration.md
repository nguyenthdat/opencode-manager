# sec-amsi-integration

> Register with AMSI for antimalware integration

## Why It Matters

AMSI (Antimalware Scan Interface) allows antimalware products to inspect script content before execution. Registering your scripts/modules with AMSI enables defenders to detect malicious behavior patterns specific to your code. AMSI integration is a responsible practice for any widely-distributed PowerShell module.

## Bad

```powershell
# No AMSI awareness — scripts execute without AV visibility
# Malware can abuse your module's functionality without detection

function Invoke-DataImport {
    param($Source)

    # Direct .NET call — AV can't inspect the intent
    [System.Reflection.Assembly]::Load(
        [System.Net.WebClient]::new().DownloadData($Source)
    )
}
```

## Good

```powershell
# Register content with AMSI for inspection
function Invoke-DataImport {
    [CmdletBinding()]
    param($Source)

    # Let AMSI inspect dynamically generated/loaded code
    $content = Invoke-RestMethod $Source

    # AMSI automatically inspects script blocks and .NET loads
    # But you can explicitly register content:
    $amsiContext = [System.IntPtr]::Zero
    $session = [Microsoft.PowerShell.Commands.AmsiUtils]::AmsiInitialize(
        'MyModule', [ref]$amsiContext
    )

    try {
        $result = [Microsoft.PowerShell.Commands.AmsiUtils]::AmsiScanString(
            $amsiContext, $content, 'data-import', [System.IntPtr]::Zero
        )
        if ($result -ne 'NotDetected') {
            throw "AMSI detected potentially malicious content"
        }
    } finally {
        [Microsoft.PowerShell.Commands.AmsiUtils]::AmsiUninitialize($amsiContext)
    }
}
```

## Module-Level AMSI

```powershell
# In module manifest (.psd1):
@{
    # Mark module as AMSI-aware
    PrivateData = @{
        PSData = @{
            # AMSI-aware module metadata
            Tags = @('Security', 'AMSI')
            Prerelease = ''
        }
    }
}

# Keep PowerShell updated for latest AMSI protections
# PS 7.2+ includes enhanced AMSI integration
```

## See Also

- [sec-execution-policy](sec-execution-policy.md) - Execution policy
- [sec-constrained-language](sec-constrained-language.md) - ConstrainedLanguage mode
