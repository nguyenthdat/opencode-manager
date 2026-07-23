# doc-updateable-help

> Support Update-Help with HelpInfoUri

## Why It Matters

`HelpInfoUri` in the module manifest enables `Update-Help` to fetch the latest help content from your server — without re-installing the module. This lets you fix documentation errors, add examples, and improve clarity between releases. Users expect this from published modules.

## Bad

```powershell
# Module manifest without HelpInfoUri
@{
    ModuleVersion = '1.0.0'
    # No HelpInfoUri — Update-Help does nothing
}

# Users stuck with shipped help forever
Update-Help -Module MyModule  # No updates available
```

## Good

```powershell
# Module manifest with HelpInfoUri
@{
    ModuleVersion = '1.0.0'
    HelpInfoUri    = 'https://myorg.com/powershell/help/MyModule/'
    PrivateData    = @{
        PSData = @{
            ProjectUri = 'https://github.com/myorg/MyModule'
        }
    }
}

# Host the help file at the HelpInfoUri:
# https://myorg.com/powershell/help/MyModule/MyModule_1.0.0_HelpInfo.xml

# HelpInfo XML format:
# <?xml version="1.0" encoding="utf-8"?>
# <HelpInfo xmlns="http://schemas.microsoft.com/powershell/help/2010/05">
#   <HelpContentURI>https://myorg.com/powershell/help/MyModule/</HelpContentURI>
#   <SupportedUICultures>
#     <UICulture>
#       <UICultureName>en-US</UICultureName>
#       <UICultureVersion>1.0.0</UICultureVersion>
#     </UICulture>
#   </SupportedUICultures>
# </HelpInfo>

# Users can now update help independently
Update-Help -Module MyModule -Force
```

## Updateable Help Setup

```powershell
# 1. Generate MAML help (see doc-maml-external)
New-ExternalHelp -Path ./docs -OutputPath ./en-US/

# 2. Create HelpInfo XML
$helpInfo = @"
<?xml version="1.0" encoding="utf-8"?>
<HelpInfo xmlns="http://schemas.microsoft.com/powershell/help/2010/05">
  <HelpContentURI>https://myorg.com/help/MyModule/</HelpContentURI>
  <SupportedUICultures>
    <UICulture>
      <UICultureName>en-US</UICultureName>
      <UICultureVersion>1.0.0</UICultureVersion>
    </UICulture>
  </SupportedUICultures>
</HelpInfo>
"@

# 3. Upload to URL and set HelpInfoUri in manifest
```

## See Also

- [doc-maml-external](doc-maml-external.md) - MAML generation
- [doc-comment-based-help](doc-comment-based-help.md) - Comment-based help
